import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { LEVELS, verdictFor, type Level } from "@/lib/competency";
import type { User } from "@/lib/auth";
import { HttpError, badRequest, notFound } from "@/lib/api/http";
import * as engine from "@/lib/ai/engine";
import type { PersonaContext, ScenarioContext } from "@/lib/ai/prompts";
import type { CriterionScore, Mood, TranscriptTurn } from "@/lib/types";
import { applyAttemptScores, publicPersona, publicScenario } from "./progress";

export const MAX_HINTS = 2;

type Attempt = typeof schema.attempts.$inferSelect;
type Scenario = typeof schema.scenarios.$inferSelect;
type Persona = typeof schema.personas.$inferSelect;

async function loadScenario(id: string) {
  const scenario = await db.query.scenarios.findFirst({ where: eq(schema.scenarios.id, id) });
  if (!scenario) throw notFound("Scenario");
  return scenario;
}

async function loadSimulation(scenario: Scenario) {
  if (scenario.kind !== "simulation" || !scenario.personaId) throw badRequest("Scenario is not a simulation");
  const persona = await db.query.personas.findFirst({ where: eq(schema.personas.id, scenario.personaId) });
  if (!persona) throw notFound("Persona");
  return persona;
}

export async function loadOwnedAttempt(user: User, attemptId: string) {
  const attempt = await db.query.attempts.findFirst({
    where: and(eq(schema.attempts.id, attemptId), eq(schema.attempts.userId, user.id)),
  });
  if (!attempt) throw notFound("Attempt");
  return attempt;
}

async function loadTranscript(attemptId: string): Promise<TranscriptTurn[]> {
  const rows = await db
    .select()
    .from(schema.attemptMessages)
    .where(eq(schema.attemptMessages.attemptId, attemptId))
    .orderBy(asc(schema.attemptMessages.turn));
  return rows.map((r) => ({ turn: r.turn, role: r.role, content: r.content }));
}

const personaCtx = (p: Persona): PersonaContext => p;
const scenarioCtx = (s: Scenario, level: Level): ScenarioContext => ({
  title: s.title,
  briefing: s.briefing,
  objectives: s.objectives,
  targetLevel: level,
});

/**
 * Start a simulation. With `retryOf` + `fromTurn`, the new attempt copies the
 * transcript up to (not including) that consultant turn, so the user can
 * replay a single moment.
 */
export async function startSimulation(
  user: User,
  input: { scenarioId: string; targetLevel?: Level; retryOf?: string; fromTurn?: number },
) {
  const scenario = await loadScenario(input.scenarioId);
  const persona = await loadSimulation(scenario);
  const level = input.targetLevel ?? scenario.targetLevel;

  let seed: TranscriptTurn[] = [];
  if (input.retryOf) {
    const prior = await loadOwnedAttempt(user, input.retryOf);
    if (prior.scenarioId !== scenario.id) throw badRequest("retryOf must be an attempt of the same scenario");
    const transcript = await loadTranscript(prior.id);
    const from = input.fromTurn ?? 1;
    const target = transcript.find((t) => t.turn === from);
    if (!target || target.role !== "user") throw badRequest("fromTurn must be one of your turns");
    seed = transcript.filter((t) => t.turn < from);
  } else if (scenario.openingLine) {
    seed = [{ turn: 0, role: "persona", content: scenario.openingLine }];
  }

  const [attempt] = await db
    .insert(schema.attempts)
    .values({
      userId: user.id,
      scenarioId: scenario.id,
      mode: "simulation",
      targetLevel: level,
      mood: "guarded",
      retryOfAttemptId: input.retryOf ?? null,
      retryFromTurn: input.fromTurn ?? null,
    })
    .returning();

  if (seed.length) {
    await db.insert(schema.attemptMessages).values(seed.map((t) => ({ attemptId: attempt.id, ...t })));
  }

  return getAttemptView(user, attempt.id, { scenario, persona });
}

export async function getAttemptView(user: User, attemptId: string, preloaded?: { scenario: Scenario; persona: Persona | null }) {
  const attempt = await loadOwnedAttempt(user, attemptId);
  const scenario = preloaded?.scenario ?? (await loadScenario(attempt.scenarioId));
  const persona =
    preloaded?.persona ??
    (scenario.personaId ? ((await db.query.personas.findFirst({ where: eq(schema.personas.id, scenario.personaId) })) ?? null) : null);
  const messages = await loadTranscript(attempt.id);

  return {
    attempt: publicAttempt(attempt),
    scenario: { ...publicScenario(scenario), briefing: scenario.briefing, objectives: scenario.objectives, maxTurns: scenario.maxTurns },
    persona: persona ? publicPersona(persona) : null,
    messages,
    hintsRemaining: MAX_HINTS - attempt.hintsUsed,
  };
}

export type SimEvent =
  | { type: "user_message"; turn: number }
  | { type: "delta"; text: string }
  | { type: "persona_message"; turn: number; content: string }
  | { type: "signals"; mood: Mood; objectivesMet: string[]; ended: boolean }
  | { type: "error"; message: string };

/**
 * Record the consultant's message, stream the persona's reply, then assess
 * mood/objectives. Yields events for the SSE stream.
 */
export async function prepareMessage(user: User, attemptId: string, content: string) {
  const attempt = await loadOwnedAttempt(user, attemptId);
  if (attempt.status !== "in_progress") throw new HttpError(409, "This session has ended", "attempt_closed");

  const scenario = await loadScenario(attempt.scenarioId);
  const persona = await loadSimulation(scenario);
  const transcript = await loadTranscript(attempt.id);
  const last = transcript.at(-1);
  if (last?.role === "user") throw new HttpError(409, "Wait for the client to reply", "awaiting_reply");

  const userTurns = transcript.filter((t) => t.role === "user").length;
  if (userTurns >= scenario.maxTurns) throw new HttpError(409, "Turn limit reached — end the conversation", "turn_limit");

  const turn = (last?.turn ?? -1) + 1;
  await db.insert(schema.attemptMessages).values({ attemptId, turn, role: "user", content });
  transcript.push({ turn, role: "user", content });

  return run();

  async function* run(): AsyncGenerator<SimEvent> {
    yield { type: "user_message", turn };
    const ctx = scenarioCtx(scenario, attempt.targetLevel);
    let reply = "";
    try {
      for await (const text of engine.streamPersonaReply(personaCtx(persona), ctx, null, transcript)) {
        reply += text;
        yield { type: "delta", text };
      }
    } catch (err) {
      console.error(err);
      // Roll back the consultant's message so they can resend it.
      await db
        .delete(schema.attemptMessages)
        .where(and(eq(schema.attemptMessages.attemptId, attemptId), eq(schema.attemptMessages.turn, turn)));
      yield { type: "error", message: "The client couldn't respond. Please try sending again." };
      return;
    }

    const personaTurn = turn + 1;
    transcript.push({ turn: personaTurn, role: "persona", content: reply.trim() });
    yield { type: "persona_message", turn: personaTurn, content: reply.trim() };

    let signals: engine.Signals = { mood: attempt.mood, objectivesMet: attempt.objectivesMet, personaEndedConversation: false };
    try {
      signals = await engine.assessTurn(personaCtx(persona), ctx, transcript);
    } catch (err) {
      console.error("assessTurn failed; keeping previous signals", err);
    }
    const objectivesMet = [...new Set([...attempt.objectivesMet, ...signals.objectivesMet])];
    const ended = signals.personaEndedConversation || userTurns + 1 >= scenario.maxTurns;

    await db.insert(schema.attemptMessages).values({ attemptId, turn: personaTurn, role: "persona", content: reply.trim(), mood: signals.mood });
    await db.update(schema.attempts).set({ mood: signals.mood, objectivesMet }).where(eq(schema.attempts.id, attemptId));

    yield { type: "signals", mood: signals.mood, objectivesMet, ended };
  }
}

/** Hints nudge toward the next unmet objective. Deliberately not AI — cheap and predictable. */
export async function useHint(user: User, attemptId: string) {
  const attempt = await loadOwnedAttempt(user, attemptId);
  if (attempt.status !== "in_progress") throw new HttpError(409, "This session has ended", "attempt_closed");
  if (attempt.hintsUsed >= MAX_HINTS) throw new HttpError(409, "No hints left", "no_hints");
  const scenario = await loadScenario(attempt.scenarioId);
  const next = scenario.objectives.find((o) => !attempt.objectivesMet.includes(o.id));
  await db.update(schema.attempts).set({ hintsUsed: attempt.hintsUsed + 1 }).where(eq(schema.attempts.id, attemptId));
  return {
    hint: next ? `Focus on this next: ${next.label.toLowerCase()}.` : "You've hit every objective — close with a clear next step.",
    hintsRemaining: MAX_HINTS - attempt.hintsUsed - 1,
  };
}

/** Evaluate + coach a finished simulation, store the report and update scores. Idempotent. */
export async function completeSimulation(user: User, attemptId: string) {
  const attempt = await loadOwnedAttempt(user, attemptId);
  if (attempt.status === "completed") return getReport(user, attemptId);
  if (attempt.status !== "in_progress") throw new HttpError(409, "This attempt is already being evaluated", "attempt_busy");

  const scenario = await loadScenario(attempt.scenarioId);
  const persona = await loadSimulation(scenario);
  const transcript = await loadTranscript(attempt.id);
  if (!transcript.some((t) => t.role === "user")) throw badRequest("Say something before ending the conversation");

  const work = engine.simulationWork(personaCtx(persona), scenarioCtx(scenario, attempt.targetLevel), transcript);
  return finalizeAttempt(user, attempt, scenario, work);
}

/** Shared by simulations and storyboards: evaluator → coach → report → scores. */
export async function finalizeAttempt(user: User, attempt: Attempt, scenario: Scenario, work: engine.Work) {
  // Claim the attempt so a double-click can't evaluate it twice.
  const claimed = await db
    .update(schema.attempts)
    .set({ status: "evaluating" })
    .where(and(eq(schema.attempts.id, attempt.id), eq(schema.attempts.status, "in_progress")))
    .returning();
  if (!claimed.length) throw new HttpError(409, "This attempt is already being evaluated", "attempt_busy");

  try {
    const rubric = await db.query.rubrics.findFirst({ where: eq(schema.rubrics.id, scenario.rubricId) });
    if (!rubric) throw notFound("Rubric");

    const evaluation = await engine.evaluate(work, attempt.targetLevel, rubric.criteria);
    const coaching = await engine.coach(work, attempt.targetLevel, evaluation, rubric.criteria, user.coachTone);

    const criteria: CriterionScore[] = evaluation.criteria.map((e) => {
      const c = rubric.criteria.find((rc) => rc.id === e.criterionId)!;
      return { criterionId: c.id, label: c.label, competency: c.competency, score: e.score, rationale: e.rationale };
    });
    const overall = Math.round((criteria.reduce((s, c) => s + c.score, 0) / criteria.length) * 10) / 10;
    const { deltas, readinessBefore, readinessAfter } = await applyAttemptScores(user, attempt.id, attempt.targetLevel, criteria);

    await db.insert(schema.feedbackReports).values({
      attemptId: attempt.id,
      summary: coaching.summary,
      criteria,
      moments: coaching.moments,
      topBehaviours: coaching.topBehaviours,
      competencyDeltas: deltas,
      readinessBefore,
      readinessAfter,
    });
    await db
      .update(schema.attempts)
      .set({ status: "completed", overallScore: overall, verdict: verdictFor(overall), completedAt: new Date() })
      .where(eq(schema.attempts.id, attempt.id));
  } catch (err) {
    // Release the claim so the user can retry evaluation.
    await db.update(schema.attempts).set({ status: "in_progress" }).where(eq(schema.attempts.id, attempt.id));
    throw err;
  }

  return getReport(user, attempt.id);
}

export async function abandonAttempt(user: User, attemptId: string) {
  const attempt = await loadOwnedAttempt(user, attemptId);
  if (attempt.status !== "in_progress") return publicAttempt(attempt);
  const [updated] = await db.update(schema.attempts).set({ status: "abandoned" }).where(eq(schema.attempts.id, attemptId)).returning();
  return publicAttempt(updated);
}

export async function getReport(user: User, attemptId: string) {
  const attempt = await loadOwnedAttempt(user, attemptId);
  const report = await db.query.feedbackReports.findFirst({ where: eq(schema.feedbackReports.attemptId, attemptId) });
  if (!report) throw new HttpError(404, "Feedback isn't ready for this attempt", "report_not_ready");
  const scenario = await loadScenario(attempt.scenarioId);
  const levelIdx = LEVELS.indexOf(attempt.targetLevel);

  return {
    attempt: publicAttempt(attempt),
    scenario: publicScenario(scenario),
    verdict: attempt.verdict,
    overallScore: attempt.overallScore,
    summary: report.summary,
    criteria: report.criteria,
    moments: report.moments,
    topBehaviours: report.topBehaviours,
    competencyDeltas: report.competencyDeltas,
    readiness: { before: report.readinessBefore, after: report.readinessAfter },
    nextLevel: LEVELS[levelIdx + 1] ?? null,
    createdAt: report.createdAt,
  };
}

function publicAttempt(a: Attempt) {
  return {
    id: a.id,
    scenarioId: a.scenarioId,
    mode: a.mode,
    targetLevel: a.targetLevel,
    status: a.status,
    mood: a.mood,
    objectivesMet: a.objectivesMet,
    hintsUsed: a.hintsUsed,
    overallScore: a.overallScore,
    verdict: a.verdict,
    retryOfAttemptId: a.retryOfAttemptId,
    retryFromTurn: a.retryFromTurn,
    startedAt: a.startedAt,
    completedAt: a.completedAt,
  };
}


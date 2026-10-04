import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { InterviewEventType, InterviewMetrics, InterviewSectionState } from "@/db/schema";
import { getPack, type AssessmentPack, type InterviewSection } from "@/content/assessment";
import type { Level } from "@/lib/competency";
import { HttpError, badRequest, isUuid, notFound } from "@/lib/api/http";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { aiMode, scoringModel } from "@/lib/env";
import { AiUnavailableError } from "@/lib/ai/client";
import * as engine from "@/lib/ai/engine";
import { DIMENSION_LABELS, GUARD_REFUSALS, answerAssistant, guardAssistantRequest, scoreInterview, type InterviewEvidence } from "@/lib/ai/interview";
import type { User } from "@/lib/auth";

type Interview = typeof schema.interviews.$inferSelect;

const LINK_VALID_DAYS = 14;
/** Grace for network latency on the last autosave; the UI submits at 0:00. */
const GRACE_MS = 20_000;
const MAX_ASSISTANT_PROMPTS = 25;
const MAX_PROMPT_CHARS = 1500;
const MAX_ANSWER_CHARS = 8000;
const MAX_MESSAGE_CHARS = 2000;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(24).toString("base64url");

function packFor(iv: Interview): AssessmentPack {
  const pack = getPack(iv.packId);
  if (!pack) throw new HttpError(500, "Assessment pack missing", "pack_missing");
  return pack;
}

async function logEvent(interviewId: string, sectionId: string | null, type: InterviewEventType, content?: string | null, meta?: Record<string, unknown>) {
  await db.insert(schema.interviewEvents).values({ interviewId, sectionId, type, content: content ?? null, meta: meta ?? null });
}

async function events(interviewId: string) {
  return db.select().from(schema.interviewEvents).where(eq(schema.interviewEvents.interviewId, interviewId)).orderBy(asc(schema.interviewEvents.createdAt));
}

// =====================================================================
// Assessor side
// =====================================================================

export async function createInterview(assessor: User, input: { candidateName: string; candidateEmail?: string; targetLevel: Level; packId: string }) {
  const pack = getPack(input.packId);
  if (!pack) throw badRequest("Unknown assessment pack");
  const token = newToken();
  const [iv] = await db
    .insert(schema.interviews)
    .values({
      tokenHash: hashToken(token),
      packId: pack.id,
      candidateName: input.candidateName,
      candidateEmail: input.candidateEmail || null,
      targetLevel: input.targetLevel,
      createdBy: assessor.id,
      expiresAt: new Date(Date.now() + LINK_VALID_DAYS * 86_400_000),
    })
    .returning();
  return { interview: summary(iv), token };
}

export async function regenerateLink(id: string) {
  const iv = await loadById(id);
  if (iv.status !== "invited") throw new HttpError(409, "The candidate has already started; the link can't be changed", "already_started");
  const token = newToken();
  await db
    .update(schema.interviews)
    .set({ tokenHash: hashToken(token), expiresAt: new Date(Date.now() + LINK_VALID_DAYS * 86_400_000) })
    .where(eq(schema.interviews.id, id));
  return { token };
}

export async function listInterviews() {
  const rows = await db.select().from(schema.interviews).orderBy(desc(schema.interviews.createdAt)).limit(500);
  return rows.map(summary);
}

async function loadById(id: string) {
  if (!isUuid(id)) throw notFound("Interview");
  const iv = await db.query.interviews.findFirst({ where: eq(schema.interviews.id, id) });
  if (!iv) throw notFound("Interview");
  return iv;
}

export async function getInterviewReport(id: string) {
  const iv = await closeExpiredSections(await loadById(id));
  const pack = packFor(iv);
  const evs = await events(iv.id);
  return {
    interview: { ...summary(iv), assessorNotes: iv.assessorNotes, scoringModel: iv.scoringModel, scoringError: iv.scoringError },
    pack: { id: pack.id, title: pack.title, totalMin: pack.totalMin, sections: pack.sections.map(publicSection), plantedError: pack.plantedError },
    sections: iv.sections,
    result: iv.result,
    events: evs.map((e) => ({ id: e.id, sectionId: e.sectionId, type: e.type, content: e.content, meta: e.meta, at: e.createdAt })),
  };
}

export async function updateInterview(id: string, patch: { assessorNotes?: string; revoke?: boolean }) {
  const iv = await loadById(id);
  await db
    .update(schema.interviews)
    .set({
      ...(patch.assessorNotes !== undefined ? { assessorNotes: patch.assessorNotes } : {}),
      ...(patch.revoke && (iv.status === "invited" || iv.status === "in_progress") ? { status: "revoked" as const } : {}),
    })
    .where(eq(schema.interviews.id, id));
  return getInterviewReport(id);
}

export async function deleteInterview(id: string) {
  await loadById(id);
  await db.delete(schema.interviews).where(eq(schema.interviews.id, id));
  return { deleted: true };
}

/** Re-run scoring (e.g. after a transient AI failure). */
export async function rescore(id: string) {
  const iv = await loadById(id);
  if (iv.status !== "submitted" && iv.status !== "scored") throw new HttpError(409, "The candidate hasn't finished yet", "not_submitted");
  await runScoring(iv.id);
  return getInterviewReport(id);
}

function summary(iv: Interview) {
  return {
    id: iv.id,
    candidateName: iv.candidateName,
    candidateEmail: iv.candidateEmail,
    targetLevel: iv.targetLevel,
    packId: iv.packId,
    status: iv.status,
    expiresAt: iv.expiresAt,
    startedAt: iv.startedAt,
    submittedAt: iv.submittedAt,
    createdAt: iv.createdAt,
    overallScore: iv.result?.overallScore ?? null,
    recommendation: iv.result?.recommendation ?? null,
    scoringError: iv.scoringError,
  };
}

// =====================================================================
// Candidate side (authenticated by the link token)
// =====================================================================

async function loadByToken(token: string) {
  if (!token || token.length > 100) throw notFound("Interview");
  const iv = await db.query.interviews.findFirst({ where: eq(schema.interviews.tokenHash, hashToken(token)) });
  if (!iv || iv.status === "revoked") throw notFound("Interview");
  if (iv.status === "invited" && iv.expiresAt < new Date()) throw new HttpError(410, "This interview link has expired. Please contact your recruiter.", "expired");
  return closeExpiredSections(iv);
}

function publicSection(s: InterviewSection) {
  return {
    id: s.id,
    kind: s.kind,
    title: s.title,
    durationMin: s.durationMin,
    instructions: s.instructions,
    aiAssistant: s.aiAssistant,
    questions: s.questions,
    maxTurns: s.maxTurns ?? null,
  };
}

/** Close any section whose time is up (answers as last autosaved). Lazy, so it also works after a closed tab. */
async function closeExpiredSections(iv: Interview): Promise<Interview> {
  if (iv.status !== "in_progress") return iv;
  const now = Date.now();
  let changed = false;
  const sections = iv.sections.map((s) => {
    if (!s.submittedAt && new Date(s.deadline).getTime() + GRACE_MS < now) {
      changed = true;
      return { ...s, submittedAt: new Date(new Date(s.deadline).getTime()).toISOString(), timedOut: true };
    }
    return s;
  });
  if (!changed) return iv;
  const pack = packFor(iv);
  const done = sections.length === pack.sections.length && sections.every((s) => s.submittedAt);
  const [updated] = await db
    .update(schema.interviews)
    .set({ sections, ...(done ? { status: "submitted" as const, submittedAt: new Date() } : {}) })
    .where(eq(schema.interviews.id, iv.id))
    .returning();
  if (done) void runScoring(iv.id);
  return updated;
}

function currentSection(iv: Interview) {
  return iv.sections.find((s) => !s.submittedAt) ?? null;
}

function requireOpenSection(iv: Interview, sectionId: string) {
  if (iv.status !== "in_progress") throw new HttpError(409, "This interview isn't in progress", "not_in_progress");
  const s = iv.sections.find((x) => x.sectionId === sectionId);
  if (!s || s.submittedAt) throw new HttpError(409, "This section is closed", "section_closed");
  if (new Date(s.deadline).getTime() + GRACE_MS < Date.now()) throw new HttpError(409, "Time is up for this section", "time_up");
  return s;
}

/** Everything the candidate UI needs — and nothing assessor-only. */
export async function candidateView(token: string) {
  const iv = await loadByToken(token);
  const pack = packFor(iv);
  const evs = iv.status === "in_progress" ? await events(iv.id) : [];
  const started = iv.sections.map((s) => s.sectionId);
  const current = currentSection(iv);
  return {
    candidateName: iv.candidateName,
    status: iv.status,
    consented: !!iv.consentAt,
    serverNow: new Date().toISOString(),
    pack: {
      title: pack.title,
      summary: pack.summary,
      totalMin: pack.totalMin,
      sections: pack.sections.map(publicSection),
    },
    // The case pack is only revealed once the clock is running.
    casePack: started.length ? pack.casePack : null,
    aiPreRead: started.includes("s2") ? pack.aiPreRead : null,
    persona: started.includes("s3")
      ? { id: pack.persona.id, name: pack.persona.name, title: pack.persona.title, company: pack.persona.company }
      : null,
    sections: iv.sections.map((s) => ({
      sectionId: s.sectionId,
      startedAt: s.startedAt,
      deadline: s.deadline,
      submittedAt: s.submittedAt,
      timedOut: s.timedOut,
      // Only the open section's answers come back; finished work is locked.
      answers: current?.sectionId === s.sectionId ? s.answers : {},
    })),
    assistantLog: evs
      .filter((e) => e.sectionId === "s2" && (e.type === "assistant_prompt" || e.type === "assistant_reply" || e.type === "guardrail_block"))
      .map((e) => ({
        role: e.type === "assistant_prompt" ? "candidate" : "assistant",
        content: e.type === "guardrail_block" ? String(e.meta?.refusal ?? "") : e.content ?? "",
        blocked: e.type === "guardrail_block",
      })),
    assistantPromptsLeft: MAX_ASSISTANT_PROMPTS - evs.filter((e) => e.type === "assistant_prompt").length,
    conversation: evs
      .filter((e) => e.type === "persona_message" || e.type === "candidate_message")
      .map((e) => ({ role: e.type === "candidate_message" ? "candidate" : "client", content: e.content ?? "" })),
  };
}

export async function giveConsent(token: string) {
  const iv = await loadByToken(token);
  if (!iv.consentAt) await db.update(schema.interviews).set({ consentAt: new Date() }).where(eq(schema.interviews.id, iv.id));
  return candidateView(token);
}

export async function startSection(token: string, sectionId: string) {
  const iv = await loadByToken(token);
  if (!iv.consentAt) throw new HttpError(409, "Please confirm the instructions first", "no_consent");
  if (aiMode === "off") throw new AiUnavailableError();
  const pack = packFor(iv);
  const next = pack.sections[iv.sections.length];
  if (!next || next.id !== sectionId) throw new HttpError(409, "Sections must be taken in order", "wrong_section");
  if (iv.sections.some((s) => !s.submittedAt)) throw new HttpError(409, "Finish the current section first", "section_open");
  if (iv.status !== "invited" && iv.status !== "in_progress") throw new HttpError(409, "This interview has finished", "finished");

  const now = new Date();
  const state: InterviewSectionState = {
    sectionId,
    startedAt: now.toISOString(),
    deadline: new Date(now.getTime() + next.durationMin * 60_000).toISOString(),
    submittedAt: null,
    timedOut: false,
    answers: {},
  };
  await db
    .update(schema.interviews)
    .set({ status: "in_progress", startedAt: iv.startedAt ?? now, sections: [...iv.sections, state] })
    .where(and(eq(schema.interviews.id, iv.id), inArray(schema.interviews.status, ["invited", "in_progress"])));
  await logEvent(iv.id, sectionId, "section_started");
  if (next.kind === "client_conversation") await logEvent(iv.id, sectionId, "persona_message", pack.persona.openingLine);
  return candidateView(token);
}

function cleanAnswers(section: InterviewSection, answers: Record<string, unknown>) {
  const ids = new Set(section.questions.map((q) => q.id));
  return Object.fromEntries(
    Object.entries(answers)
      .filter(([k, v]) => ids.has(k) && typeof v === "string")
      .map(([k, v]) => [k, (v as string).slice(0, MAX_ANSWER_CHARS)]),
  );
}

export async function saveAnswers(token: string, sectionId: string, answers: Record<string, unknown>, submit: boolean) {
  const iv = await loadByToken(token);
  const open = requireOpenSection(iv, sectionId);
  const section = packFor(iv).sections.find((s) => s.id === sectionId)!;
  const merged = { ...open.answers, ...cleanAnswers(section, answers) };
  const sections = iv.sections.map((s) =>
    s.sectionId === sectionId ? { ...s, answers: merged, ...(submit ? { submittedAt: new Date().toISOString() } : {}) } : s,
  );
  const done = submit && sections.length === packFor(iv).sections.length && sections.every((s) => s.submittedAt);
  await db
    .update(schema.interviews)
    .set({ sections, ...(done ? { status: "submitted" as const, submittedAt: new Date() } : {}) })
    .where(eq(schema.interviews.id, iv.id));
  if (submit) await logEvent(iv.id, sectionId, "section_submitted");
  if (done) void runScoring(iv.id);
  return submit ? candidateView(token) : { saved: true, savedAt: new Date().toISOString() };
}

/** The guarded case assistant (AI section only). */
export async function askAssistant(token: string, request: string) {
  const iv = await loadByToken(token);
  const pack = packFor(iv);
  const sectionId = pack.sections.find((s) => s.aiAssistant)?.id;
  if (!sectionId) throw new HttpError(409, "No AI assistant in this exercise", "no_assistant");
  requireOpenSection(iv, sectionId);
  checkRateLimit(`iv:${iv.id}`, "message");

  const text = request.trim();
  if (!text) throw badRequest("Type a question for the assistant");
  if (text.length > MAX_PROMPT_CHARS) throw badRequest(`Keep requests under ${MAX_PROMPT_CHARS} characters`);
  const evs = await events(iv.id);
  const used = evs.filter((e) => e.type === "assistant_prompt").length;
  if (used >= MAX_ASSISTANT_PROMPTS) throw new HttpError(429, "You've used all your assistant requests for this exercise", "assistant_limit");

  await logEvent(iv.id, sectionId, "assistant_prompt", text);
  const guard = await guardAssistantRequest(pack, text);
  if (!guard.allowed) {
    const refusal = GUARD_REFUSALS[guard.category] ?? GUARD_REFUSALS.off_topic;
    await logEvent(iv.id, sectionId, "guardrail_block", null, { category: guard.category, reason: guard.reason, refusal });
    return { reply: refusal, blocked: true, category: guard.category, promptsLeft: MAX_ASSISTANT_PROMPTS - used - 1 };
  }

  // History: allowed prompt/reply pairs only, so refused requests never reach the assistant.
  const history: { role: "user" | "assistant"; content: string }[] = [];
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    if (e.type === "assistant_prompt" && evs[i + 1]?.type === "assistant_reply") {
      history.push({ role: "user", content: e.content ?? "" }, { role: "assistant", content: evs[i + 1].content ?? "" });
    }
  }
  const reply = await answerAssistant(pack, history.slice(-16), text);
  await logEvent(iv.id, sectionId, "assistant_reply", reply, { category: guard.category });
  return { reply, blocked: false, category: guard.category, promptsLeft: MAX_ASSISTANT_PROMPTS - used - 1 };
}

/** One turn of the client conversation section. */
export async function sendClientMessage(token: string, content: string) {
  const iv = await loadByToken(token);
  const pack = packFor(iv);
  const section = pack.sections.find((s) => s.kind === "client_conversation");
  if (!section) throw new HttpError(409, "No client conversation in this exercise", "no_conversation");
  requireOpenSection(iv, section.id);
  checkRateLimit(`iv:${iv.id}`, "message");

  const text = content.trim().slice(0, MAX_MESSAGE_CHARS);
  if (!text) throw badRequest("Type your reply");
  const evs = await events(iv.id);
  const convo = evs.filter((e) => e.type === "persona_message" || e.type === "candidate_message");
  const last = convo.at(-1);
  if (last?.type === "candidate_message") throw new HttpError(409, "Wait for the client to reply", "awaiting_reply");
  const candidateTurns = convo.filter((e) => e.type === "candidate_message").length;
  const maxTurns = section.maxTurns ?? 8;
  if (candidateTurns >= maxTurns) throw new HttpError(409, "You've used all your replies", "turn_limit");

  await logEvent(iv.id, section.id, "candidate_message", text);
  const memo = iv.sections.find((s) => s.sectionId === "s2")?.answers.memo ?? "(no memo submitted)";
  const turns = [...convo, { type: "candidate_message" as const, content: text }].map((e, i) => ({
    turn: i,
    role: e.type === "candidate_message" ? ("user" as const) : ("persona" as const),
    content: e.content ?? "",
  }));
  const persona = { name: pack.persona.name, title: pack.persona.title, company: pack.persona.company, personality: pack.persona.personality, brief: pack.persona.brief };
  const scenario = {
    title: pack.title,
    targetLevel: iv.targetLevel,
    objectives: [],
    briefing: {
      situation: `${pack.casePack.question}\n\nYou have read the consultant's recommendation memo:\n"""\n${memo}\n"""\nChallenge it on what matters to you. This is a job interview exercise for the consultant, but stay fully in character.`,
      yourRole: "A consultant presenting their recommendation.",
      objective: "",
      whatGoodLooksLike: {},
    },
  };
  let reply = "";
  try {
    for await (const chunk of engine.streamPersonaReply(persona, scenario, null, turns)) reply += chunk;
  } catch (err) {
    // Let the candidate resend: remove their message so the turn isn't lost.
    const mine = (await events(iv.id)).filter((e) => e.type === "candidate_message").at(-1);
    if (mine) await db.delete(schema.interviewEvents).where(eq(schema.interviewEvents.id, mine.id));
    throw err;
  }
  await logEvent(iv.id, section.id, "persona_message", reply.trim());
  return { reply: reply.trim(), turnsLeft: maxTurns - candidateTurns - 1 };
}

const TELEMETRY_TYPES = new Set<InterviewEventType>(["paste", "copy_blocked", "tab_hidden", "tab_visible"]);

/** Integrity signals from the browser: paste sizes, blocked copies, time away from the tab. */
export async function recordTelemetry(token: string, items: { type: string; sectionId?: string; meta?: Record<string, unknown> }[]) {
  const iv = await loadByToken(token);
  if (iv.status !== "in_progress") return { recorded: 0 };
  checkRateLimit(`iv:${iv.id}`, "telemetry");
  const rows = items
    .slice(0, 50)
    .filter((i) => TELEMETRY_TYPES.has(i.type as InterviewEventType))
    .map((i) => ({
      interviewId: iv.id,
      sectionId: typeof i.sectionId === "string" ? i.sectionId.slice(0, 10) : null,
      type: i.type as InterviewEventType,
      content: null,
      meta: Object.fromEntries(Object.entries(i.meta ?? {}).filter(([, v]) => typeof v === "number" || typeof v === "string").slice(0, 6)),
    }));
  if (rows.length) await db.insert(schema.interviewEvents).values(rows);
  return { recorded: rows.length };
}

// =====================================================================
// Scoring
// =====================================================================

function words(s: string) {
  return s.toLowerCase().replace(/\.(?=\s|$)/g, " ").replace(/[^a-z0-9£%.\s]/g, " ").split(/\s+/).filter(Boolean);
}

/** Share (0–100) of the memo's 8-word phrases that also appear in assistant replies. */
export function overlapPercent(memo: string, replies: string[], n = 8) {
  const shingles = (w: string[]) => {
    const out = new Set<string>();
    for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
    return out;
  };
  const memoSh = shingles(words(memo));
  if (!memoSh.size) return 0;
  const replySh = new Set(replies.flatMap((r) => [...shingles(words(r))]));
  let hit = 0;
  for (const s of memoSh) if (replySh.has(s)) hit++;
  return Math.round((hit / memoSh.size) * 100);
}

export function computeMetrics(sections: InterviewSectionState[], evs: { type: string; content: string | null; meta: Record<string, unknown> | null }[]): InterviewMetrics {
  const memo = sections.find((s) => s.sectionId === "s2")?.answers.memo ?? "";
  const pastes = evs.filter((e) => e.type === "paste");
  return {
    assistantPrompts: evs.filter((e) => e.type === "assistant_prompt").length,
    guardrailBlocks: evs.filter((e) => e.type === "guardrail_block").length,
    pasteEvents: pastes.length,
    largestPasteChars: Math.max(0, ...pastes.map((p) => Number(p.meta?.chars) || 0)),
    tabAwayCount: evs.filter((e) => e.type === "tab_hidden").length,
    tabAwaySeconds: Math.round(evs.filter((e) => e.type === "tab_visible").reduce((sum, e) => sum + (Number(e.meta?.awayMs) || 0), 0) / 1000),
    memoWords: words(memo).length,
    memoOverlapWithAssistant: overlapPercent(memo, evs.filter((e) => e.type === "assistant_reply").map((e) => e.content ?? "")),
    sectionMinutes: Object.fromEntries(
      sections.map((s) => [s.sectionId, Math.round(((new Date(s.submittedAt ?? s.deadline).getTime() - new Date(s.startedAt).getTime()) / 60_000) * 10) / 10]),
    ),
    timedOutSections: sections.filter((s) => s.timedOut).map((s) => s.sectionId),
  };
}

const scoringInFlight = new Set<string>();

export async function runScoring(id: string) {
  if (scoringInFlight.has(id)) return;
  scoringInFlight.add(id);
  try {
    const iv = await loadById(id);
    const pack = packFor(iv);
    const evs = await events(iv.id);
    const metrics = computeMetrics(iv.sections, evs);
    const evidence: InterviewEvidence = {
      answers: pack.sections.flatMap((sec) => {
        const st = iv.sections.find((s) => s.sectionId === sec.id);
        return sec.questions.map((q) => ({ section: sec.title, question: q.prompt, answer: st?.answers[q.id] ?? "", timedOut: !!st?.timedOut }));
      }),
      assistantLog: evs
        .filter((e) => e.type === "assistant_prompt" || e.type === "assistant_reply" || e.type === "guardrail_block")
        .map((e) => ({
          role: e.type === "assistant_prompt" ? ("candidate" as const) : e.type === "guardrail_block" ? ("blocked" as const) : ("assistant" as const),
          content: e.type === "guardrail_block" ? `Blocked by guardrail (${e.meta?.category})` : e.content ?? "",
        })),
      conversation: evs
        .filter((e) => e.type === "persona_message" || e.type === "candidate_message")
        .map((e) => ({ role: e.type === "candidate_message" ? ("candidate" as const) : ("client" as const), content: e.content ?? "" })),
      metrics,
    };
    const scoring = await scoreInterview(pack, iv.targetLevel, evidence);
    const dims = scoring.dimensions.map((d) => ({ ...d, label: DIMENSION_LABELS[d.id] ?? d.id }));
    const overall = Math.round((dims.reduce((s, d) => s + d.score, 0) / dims.length) * 10) / 10;
    await db
      .update(schema.interviews)
      .set({
        status: "scored",
        result: { ...scoring, dimensions: dims, overallScore: overall, metrics },
        scoringModel,
        scoringError: null,
      })
      .where(eq(schema.interviews.id, id));
  } catch (err) {
    console.error("Interview scoring failed", err);
    await db
      .update(schema.interviews)
      .set({ scoringError: err instanceof Error ? err.message.slice(0, 300) : "Scoring failed" })
      .where(eq(schema.interviews.id, id));
  } finally {
    scoringInFlight.delete(id);
  }
}

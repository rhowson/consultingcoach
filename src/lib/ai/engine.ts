import "server-only";
import { z } from "zod";
import { aiMockMode } from "@/lib/env";
import { LEVEL_LABELS, type Level } from "@/lib/competency";
import { MOODS, STUDIO_TAGS, type CasePack, type GhostSlide, type PyramidNode, type RubricCriterion, type TranscriptTurn } from "@/lib/types";
import { generateStructured, streamText } from "./client";
import * as mock from "./mock";
import {
  coachSystemPrompt,
  evaluatorSystemPrompt,
  personaSystemPrompt,
  redPenSystemPrompt,
  renderCasePack,
  renderPyramid,
  renderSlides,
  renderTranscript,
  signalsSystemPrompt,
  studioReviewSystemPrompt,
  type CoachTone,
  type PersonaContext,
  type ScenarioContext,
} from "./prompts";

// ---------- Schemas for structured outputs ----------

export const SignalsSchema = z.object({
  mood: z.enum(MOODS),
  objectivesMet: z.array(z.string()),
  personaEndedConversation: z.boolean(),
});
export type Signals = z.infer<typeof SignalsSchema>;

export const EvaluationSchema = z.object({
  criteria: z.array(
    z.object({
      criterionId: z.string(),
      score: z.number().int().min(1).max(5),
      rationale: z.string(),
    }),
  ),
});
export type Evaluation = z.infer<typeof EvaluationSchema>;

export const CoachingSchema = z.object({
  summary: z.string(),
  moments: z.array(
    z.object({
      ref: z.string().describe("Turn number (e.g. '3') or the slide/node id"),
      quote: z.string(),
      annotation: z.string(),
      tryInstead: z.string(),
    }),
  ),
  topBehaviours: z.array(z.string()),
});
export type Coaching = z.infer<typeof CoachingSchema>;

export const StudioReviewSchema = z.object({
  comments: z.array(
    z.object({
      targetId: z.string(),
      tag: z.enum(STUDIO_TAGS),
      severity: z.enum(["must_fix", "should_fix", "polish"]),
      body: z.string(),
      suggestion: z.string().optional(),
    }),
  ),
});
export type StudioReview = z.infer<typeof StudioReviewSchema>;

export const RedPenSchema = z.object({
  verdict: z.enum(["meets", "approaching", "below"]),
  headline: z.string(),
  topChanges: z.array(z.string()),
  annotations: z.array(
    z.object({
      quote: z.string(),
      severity: z.enum(["must_fix", "should_fix", "polish"]),
      comment: z.string(),
      rewrite: z.string(),
    }),
  ),
});
export type RedPen = z.infer<typeof RedPenSchema>;

// ---------- Actor ----------

/** Streams the persona's next line. `turns` must end with the consultant's latest message. */
export function streamPersonaReply(
  persona: PersonaContext,
  scenario: ScenarioContext,
  openingLine: string | null,
  turns: TranscriptTurn[],
): AsyncGenerator<string> {
  if (aiMockMode) return mock.streamPersonaReply(persona, turns);

  // The API needs a user turn first, so the scene-setting cue stands in for it
  // and the persona's opening line follows as its first assistant turn.
  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: "(The meeting starts.)" },
  ];
  if (openingLine) messages.push({ role: "assistant", content: openingLine });
  for (const t of turns) messages.push({ role: t.role === "user" ? "user" : "assistant", content: t.content });

  return streamText({
    system: `${personaSystemPrompt(persona, scenario)}\n\nLatency-sensitive; begin your visible answer immediately.`,
    messages,
    effort: "low",
  });
}

export async function assessTurn(
  persona: PersonaContext,
  scenario: ScenarioContext,
  turns: TranscriptTurn[],
): Promise<Signals> {
  if (aiMockMode) return mock.assessTurn(scenario, turns);
  const result = await generateStructured({
    system: signalsSystemPrompt(persona, scenario),
    prompt: `<transcript>\n${renderTranscript(turns, persona.name)}\n</transcript>`,
    schema: SignalsSchema,
    effort: "low",
  });
  const valid = new Set(scenario.objectives.map((o) => o.id));
  return { ...result, objectivesMet: result.objectivesMet.filter((id) => valid.has(id)) };
}

// ---------- Evaluator + coach ----------

/** Material under review, rendered as prompt text. */
export interface Work {
  kind: "simulation" | "storyboard";
  context: string;
  material: string;
}

export function simulationWork(persona: PersonaContext, scenario: ScenarioContext, turns: TranscriptTurn[]): Work {
  return {
    kind: "simulation",
    context: `Scenario: ${scenario.title}\n${scenario.briefing.situation}\nConsultant's role: ${scenario.briefing.yourRole}\nConsultant's objective: ${scenario.briefing.objective}\nClient: ${persona.name}, ${persona.title}, ${persona.company}`,
    material: renderTranscript(turns, persona.name),
  };
}

export function storyboardWork(casePack: CasePack, pyramid: PyramidNode | null, slides: GhostSlide[]): Work {
  return {
    kind: "storyboard",
    context: renderCasePack(casePack),
    material: `Pyramid:\n${renderPyramid(pyramid)}\n\nGhost deck:\n${renderSlides(slides)}`,
  };
}

export async function evaluate(work: Work, targetLevel: Level, criteria: RubricCriterion[]): Promise<Evaluation> {
  if (aiMockMode) return mock.evaluate(work, criteria);
  const result = await generateStructured({
    system: evaluatorSystemPrompt(targetLevel, criteria),
    prompt: `<context>\n${work.context}\n</context>\n\n<${work.kind}>\n${work.material}\n</${work.kind}>`,
    schema: EvaluationSchema,
    effort: "high",
  });
  // Keep exactly one score per rubric criterion, in rubric order.
  const byId = new Map(result.criteria.map((c) => [c.criterionId, c]));
  return {
    criteria: criteria.map(
      (c) => byId.get(c.id) ?? { criterionId: c.id, score: 1, rationale: "Not demonstrated in this attempt." },
    ),
  };
}

export async function coach(
  work: Work,
  targetLevel: Level,
  evaluation: Evaluation,
  criteria: RubricCriterion[],
  tone: CoachTone,
): Promise<Coaching> {
  if (aiMockMode) return mock.coach(work);
  const scores = evaluation.criteria
    .map((e) => `- ${criteria.find((c) => c.id === e.criterionId)?.label ?? e.criterionId}: ${e.score}/5 — ${e.rationale}`)
    .join("\n");
  const result = await generateStructured({
    system: coachSystemPrompt(targetLevel, tone),
    prompt: `<context>\n${work.context}\n</context>\n\n<${work.kind}>\n${work.material}\n</${work.kind}>\n\n<evaluation level="${LEVEL_LABELS[targetLevel]}">\n${scores}\n</evaluation>`,
    schema: CoachingSchema,
    effort: "medium",
  });
  return { ...result, moments: result.moments.slice(0, 4), topBehaviours: result.topBehaviours.slice(0, 3) };
}

// ---------- Studio + Red Pen ----------

export async function reviewStoryboard(
  casePack: CasePack,
  pyramid: PyramidNode | null,
  slides: GhostSlide[],
  stage: string,
  targetLevel: Level,
  tone: CoachTone,
): Promise<StudioReview> {
  if (aiMockMode) return mock.reviewStoryboard(pyramid, slides);
  const work = storyboardWork(casePack, pyramid, slides);
  const result = await generateStructured({
    system: studioReviewSystemPrompt(targetLevel, stage, tone),
    prompt: `<case_pack>\n${work.context}\n</case_pack>\n\n<storyboard>\n${work.material}\n</storyboard>`,
    schema: StudioReviewSchema,
    effort: "medium",
  });
  const ids = collectIds(pyramid, slides);
  return { comments: result.comments.filter((c) => ids.has(c.targetId)) };
}

export async function redPen(
  content: string,
  deliverableType: string,
  targetLevel: Level,
  tone: CoachTone,
): Promise<RedPen> {
  if (aiMockMode) return mock.redPen(content, targetLevel);
  return generateStructured({
    system: redPenSystemPrompt(targetLevel, deliverableType, tone),
    prompt: `<document>\n${content}\n</document>`,
    schema: RedPenSchema,
    effort: "high",
  });
}

function collectIds(pyramid: PyramidNode | null, slides: GhostSlide[]) {
  const ids = new Set(slides.map((s) => s.id));
  const walk = (n: PyramidNode | null) => {
    if (!n) return;
    ids.add(n.id);
    n.children.forEach(walk);
  };
  walk(pyramid);
  return ids;
}

/**
 * Deterministic stand-ins for the AI engine, used when no API key is set
 * (AI_MOCK=1 or ANTHROPIC_API_KEY empty). They let the front end and tests
 * exercise every flow without calling Claude.
 */
import type { GhostSlide, Mood, PyramidNode, RubricCriterion, TranscriptTurn } from "@/lib/types";
import type { Coaching, Evaluation, RedPen, Signals, StudioReview, Work } from "./engine";
import type { PersonaContext, ScenarioContext } from "./prompts";

const EMPATHY = /\b(sorry|understand|fair|you'?re right|hear you|apologi[sz]e)\b/i;
const QUESTION = /\?/;
const DEFENSIVE = /\b(but|actually|the data shows|benchmark)\b/i;
const NEXT_STEP = /\b(next step|follow up|by (monday|tuesday|wednesday|thursday|friday|tomorrow)|walk through|set up)\b/i;

const REPLIES: Record<Mood, string[]> = {
  calm: ["That's helpful. What would you need from my team to make this work?", "Okay. I can live with that if we agree the next steps now."],
  guarded: ["I hear you, but I'm not convinced yet. Show me why I should trust these numbers.", "Maybe. What exactly are you proposing?"],
  frustrated: ["That doesn't answer my question.", "With respect, I've heard that before. What's different this time?"],
  escalating: ["I think we're done here. I'll be raising this with your partner.", "This is exactly the problem. Nobody listens."],
};

export async function* streamPersonaReply(persona: PersonaContext, turns: TranscriptTurn[]): AsyncGenerator<string> {
  const mood = moodFor(turns);
  const options = REPLIES[mood];
  const text = options[turns.length % options.length];
  for (const word of text.split(/(?<= )/)) {
    await new Promise((r) => setTimeout(r, 25));
    yield word;
  }
  void persona;
}

export async function assessTurn(scenario: ScenarioContext, turns: TranscriptTurn[]): Promise<Signals> {
  const userText = turns.filter((t) => t.role === "user").map((t) => t.content).join(" ");
  const met: string[] = [];
  const [first, second, ...rest] = scenario.objectives;
  if (first && EMPATHY.test(userText)) met.push(first.id);
  if (second && QUESTION.test(userText)) met.push(second.id);
  if (rest.length && NEXT_STEP.test(userText)) met.push(rest[rest.length - 1].id);
  const mood = moodFor(turns);
  return { mood, objectivesMet: met, personaEndedConversation: mood === "escalating" && turns.length > 6 };
}

export async function evaluate(work: Work, criteria: RubricCriterion[]): Promise<Evaluation> {
  const base = work.kind === "simulation" ? scoreTranscriptText(work.material) : 3;
  return {
    criteria: criteria.map((c, i) => ({
      criterionId: c.id,
      score: clamp(base + (i % 2 === 0 ? 0 : -1), 1, 5),
      rationale: `[Mock] Scored on keyword heuristics for "${c.label}". Set ANTHROPIC_API_KEY for real evaluation.`,
    })),
  };
}

export async function coach(work: Work): Promise<Coaching> {
  const firstUserLine = work.material.split("\n").find((l) => l.includes("Consultant:")) ?? "";
  const turnMatch = firstUserLine.match(/\[turn (\d+)\]/);
  return {
    summary:
      "[Mock] Solid structure, but you defended the analysis before acknowledging the client's concern. Repair trust first, then move to the facts.",
    moments: [
      {
        ref: turnMatch?.[1] ?? "1",
        quote: firstUserLine.replace(/^\[turn \d+\] Consultant: /, "") || "(your opening)",
        annotation: "You went straight to the evidence. The client needed to feel heard first.",
        tryInstead:
          "You're right — you should have heard this from us first, and I'm sorry. Can we walk through what you've heard and where you think it's off?",
      },
    ],
    topBehaviours: [
      "Acknowledge the emotion before addressing the content.",
      "Ask one open question to find the real concern.",
      "Close with a specific, agreed next step and owner.",
    ],
  };
}

export async function reviewStoryboard(pyramid: PyramidNode | null, slides: GhostSlide[]): Promise<StudioReview> {
  const comments: StudioReview["comments"] = [];
  if (pyramid && pyramid.text.split(" ").length < 8) {
    comments.push({
      targetId: pyramid.id,
      tag: "insight",
      severity: "must_fix",
      body: "The governing thought reads like a topic. State the answer and why it matters.",
      suggestion: "Churn is up because out-of-contract SMB customers are leaving for cheaper bundles.",
    });
  }
  for (const s of slides) {
    const words = s.actionTitle.trim().split(/\s+/).length;
    if (words > 15) {
      comments.push({ targetId: s.id, tag: "clarity", severity: "should_fix", body: `Title is ${words} words; keep it to 15 or fewer.` });
    } else if (words < 5) {
      comments.push({ targetId: s.id, tag: "insight", severity: "must_fix", body: "This is a topic, not an insight. What does the exhibit prove?" });
    }
    if (s.slideType === "chart" && !s.exhibitId) {
      comments.push({ targetId: s.id, tag: "evidence", severity: "should_fix", body: "Pick the exhibit that proves this title." });
    }
  }
  return { comments };
}

export async function redPen(content: string, targetLevel: string): Promise<RedPen> {
  const firstSentence = content.split(/(?<=[.!?])\s/)[0]?.slice(0, 200) ?? content.slice(0, 200);
  return {
    verdict: "approaching",
    headline: `[Mock] Close to the ${targetLevel} bar — lead with the recommendation, not the context.`,
    topChanges: [
      "Open with the answer in one sentence.",
      "Cut background the reader already knows.",
      "End with a specific ask and date.",
    ],
    annotations: [
      {
        quote: firstSentence,
        severity: "must_fix",
        comment: "The opening sets context instead of giving the answer.",
        rewrite: "We recommend [decision] because [reason]; we need your approval by [date].",
      },
    ],
  };
}

function moodFor(turns: TranscriptTurn[]): Mood {
  const userTurns = turns.filter((t) => t.role === "user");
  let tension = 1; // start guarded
  for (const t of userTurns) {
    if (EMPATHY.test(t.content)) tension -= 1;
    if (DEFENSIVE.test(t.content)) tension += 1;
  }
  const moods: Mood[] = ["calm", "guarded", "frustrated", "escalating"];
  return moods[clamp(tension, 0, 3)];
}

function scoreTranscriptText(text: string) {
  let score = 2;
  if (EMPATHY.test(text)) score += 1;
  if (QUESTION.test(text)) score += 0.5;
  if (NEXT_STEP.test(text)) score += 1;
  if (DEFENSIVE.test(text)) score -= 1;
  return Math.round(score);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

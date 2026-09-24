/**
 * The competency model is the spine of the product: every score, rubric and
 * readiness number is expressed as (competency, level, 1–5 score).
 */

export const LEVELS = ["analyst", "consultant", "manager", "director"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  analyst: "Analyst",
  consultant: "Consultant",
  manager: "Manager",
  director: "Director",
};

export const COMPETENCIES = [
  "problem_solving",
  "storyboarding",
  "client_management",
  "difficult_conversations",
  "output_quality",
] as const;
export type Competency = (typeof COMPETENCIES)[number];

export const COMPETENCY_LABELS: Record<Competency, string> = {
  problem_solving: "Problem solving",
  storyboarding: "Storyboarding",
  client_management: "Client management",
  difficult_conversations: "Difficult conversations",
  output_quality: "Output quality",
};

/** What "good" looks like for each competency at each level (shown in UI and fed to evaluators). */
export const LEVEL_EXPECTATIONS: Record<Competency, Record<Level, string>> = {
  problem_solving: {
    analyst: "Structures a well-defined analysis and gets the numbers right.",
    consultant: "Builds issue trees and hypotheses; drives a workstream's analysis plan.",
    manager: "Frames the whole engagement and prioritises what matters for the answer.",
    director: "Shapes the client's agenda and reframes the question itself.",
  },
  storyboarding: {
    analyst: "Builds a single clear slide with an action title that matches its exhibit.",
    consultant: "Writes a coherent section storyline with MECE supporting points.",
    manager: "Owns the full deck narrative from governing thought to supporting evidence.",
    director: "Lands the 'so what' for a board in three slides or fewer.",
  },
  client_management: {
    analyst: "Handles data requests professionally and flags issues early.",
    consultant: "Manages workstream counterparts and keeps them bought in.",
    manager: "Manages the client lead, scope and expectations proactively.",
    director: "Manages C-suite relationships and earns follow-on work.",
  },
  difficult_conversations: {
    analyst: "Pushes back on bad data or unrealistic asks respectfully.",
    consultant: "De-escalates an unhappy stakeholder and agrees a way forward.",
    manager: "Handles scope creep, bad news and conflict without damaging trust.",
    director: "Tells a CEO their strategy is wrong and keeps the relationship.",
  },
  output_quality: {
    analyst: "Accurate, clean charts and tables with no errors.",
    consultant: "Insightful action titles; every exhibit proves its title.",
    manager: "SteerCo-ready deck with a clear recommendation and next steps.",
    director: "Board-level synthesis that drives a decision.",
  },
};

/** A competency "meets the bar" for a level when its score is at or above this. */
export const LEVEL_BAR = 3.5;

export function nextLevel(level: Level): Level | null {
  const i = LEVELS.indexOf(level);
  return i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
}

export type Verdict = "meets" | "approaching" | "below";

export function verdictFor(score: number, bar = LEVEL_BAR): Verdict {
  if (score >= bar) return "meets";
  if (score >= bar - 1) return "approaching";
  return "below";
}

/** Scores at or below this count as 0% progress toward the bar. */
const READINESS_FLOOR = 2;

/**
 * Readiness for the next level, 0–100. Each competency contributes equally,
 * capped at the bar so over-performing in one area can't hide a gap in another.
 */
export function readinessPercent(scores: Partial<Record<Competency, number>>, bar = LEVEL_BAR): number {
  const total = COMPETENCIES.reduce((sum, c) => {
    const s = scores[c] ?? 0;
    return sum + Math.min(Math.max(s - READINESS_FLOOR, 0), bar - READINESS_FLOOR) / (bar - READINESS_FLOOR);
  }, 0);
  return Math.round((total / COMPETENCIES.length) * 100);
}

/**
 * Blend a new rep's score into a running competency score. Recent reps weigh
 * more (exponential moving average) so progress shows, but one lucky rep
 * can't jump a level.
 */
export function blendScore(previous: number | null | undefined, latest: number, weight = 0.3): number {
  if (previous == null) return round1(latest);
  return round1(previous * (1 - weight) + latest * weight);
}

export function biggestGap(scores: Partial<Record<Competency, number>>): Competency {
  return [...COMPETENCIES].sort((a, b) => (scores[a] ?? 0) - (scores[b] ?? 0))[0];
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

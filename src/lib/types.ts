/**
 * Shared domain types. These are the contract between the database, the AI
 * engine and the front end — keep them in sync with docs/API.md.
 */
import type { Competency, Level, Verdict } from "@/lib/competency";

export const MOODS = ["calm", "guarded", "frustrated", "escalating"] as const;
export type Mood = (typeof MOODS)[number];

/** The hidden brief an AI persona plays from. Never sent to the client. */
export interface PersonaBrief {
  motivations: string[];
  triggers: string[];
  trustBuilders: string[];
  speakingStyle: string;
  /** Facts the persona knows and may reveal if asked well. */
  privateFacts?: string[];
}

export interface Briefing {
  situation: string;
  yourRole: string;
  objective: string;
  /** Level-specific description of what "good" looks like. */
  whatGoodLooksLike: Partial<Record<Level, string>>;
}

export interface Objective {
  id: string;
  label: string;
}

export interface RubricCriterion {
  id: string;
  label: string;
  competency: Competency;
  description: string;
}

export interface Exhibit {
  id: string;
  title: string;
  kind: "chart" | "table" | "text";
  /** Plain-text rendering of the data so both the UI and the AI can read it. */
  data: string;
}

export interface CasePack {
  client: string;
  question: string;
  exhibits: Exhibit[];
  interviews: { id: string; who: string; notes: string }[];
  clientEmail: string;
}

export type LessonBlock =
  | { type: "text"; markdown: string }
  | { type: "key_idea"; markdown: string }
  | { type: "example_pair"; bad: string; good: string; annotation: string }
  | { type: "quiz"; question: string; options: string[]; answerIndex: number; explanation: string };

export interface PlanWeek {
  week: number;
  theme: string;
  items: { kind: "lesson" | "scenario"; refId: string; title: string }[];
}

export interface CriterionScore {
  criterionId: string;
  label: string;
  competency: Competency;
  score: number;
  rationale: string;
}

export interface FeedbackMoment {
  /** Transcript turn (simulations) or slide/node id (studio). */
  ref: string;
  quote: string;
  annotation: string;
  tryInstead: string;
}

export interface PyramidNode {
  id: string;
  text: string;
  children: PyramidNode[];
}

export interface GhostSlide {
  id: string;
  actionTitle: string;
  slideType: "chart" | "table" | "text" | "framework";
  exhibitId?: string;
  chartType?: string;
  notes?: string;
}

export const STUDIO_TAGS = ["structure", "insight", "mece", "evidence", "clarity"] as const;
export type StudioTag = (typeof STUDIO_TAGS)[number];

export interface StudioComment {
  id: string;
  /** Pyramid node id or slide id the comment is pinned to. */
  targetId: string;
  tag: StudioTag;
  severity: "must_fix" | "should_fix" | "polish";
  body: string;
  suggestion?: string;
  resolved: boolean;
}

export interface RedPenAnnotation {
  id: string;
  quote: string;
  severity: "must_fix" | "should_fix" | "polish";
  comment: string;
  rewrite: string;
}

export interface RedPenResult {
  verdict: Verdict;
  headline: string;
  topChanges: string[];
  annotations: RedPenAnnotation[];
}

export interface TranscriptTurn {
  turn: number;
  role: "user" | "persona";
  content: string;
}

import {
  boolean,
  index,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Competency, Level, Verdict } from "@/lib/competency";
import type {
  Briefing,
  CasePack,
  CriterionScore,
  FeedbackMoment,
  LessonBlock,
  Mood,
  Objective,
  PersonaBrief,
  PlanWeek,
  PyramidNode,
  RedPenResult,
  RubricCriterion,
  GhostSlide,
  StudioComment,
} from "@/lib/types";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ---------- Users & progress ----------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  currentLevel: text("current_level").$type<Level>().notNull().default("analyst"),
  targetLevel: text("target_level").$type<Level>(),
  targetDate: date("target_date"),
  goal: text("goal").$type<"promotion" | "break_in" | "sharpen_skill">(),
  weeklyRepGoal: integer("weekly_rep_goal").notNull().default(5),
  coachTone: text("coach_tone").$type<"supportive" | "direct" | "partner">().notNull().default("direct"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const competencyScores = pgTable(
  "competency_scores",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    competency: text("competency").$type<Competency>().notNull(),
    score: real("score").notNull(),
    selfRating: real("self_rating"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.competency] })],
);

/** Append-only history so Progress can draw trend lines. */
export const competencyHistory = pgTable("competency_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  competency: text("competency").$type<Competency>().notNull(),
  score: real("score").notNull(),
  attemptId: uuid("attempt_id"),
  createdAt: createdAt(),
}, (t) => [index("competency_history_user_idx").on(t.userId, t.createdAt)]);

export const developmentPlans = pgTable("development_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  focus: text("focus").$type<Competency>().notNull(),
  weeks: jsonb("weeks").$type<PlanWeek[]>().notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

// ---------- Content ----------

export const personas = pgTable("personas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  personality: text("personality").notNull(),
  avatarKey: text("avatar_key").notNull(),
  brief: jsonb("brief").$type<PersonaBrief>().notNull(),
});

export const rubrics = pgTable("rubrics", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  criteria: jsonb("criteria").$type<RubricCriterion[]>().notNull(),
});

export const scenarios = pgTable("scenarios", {
  id: text("id").primaryKey(),
  kind: text("kind").$type<"simulation" | "storyboard" | "rehearsal">().notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  personaId: text("persona_id").references(() => personas.id),
  rubricId: text("rubric_id").notNull().references(() => rubrics.id),
  targetLevel: text("target_level").$type<Level>().notNull(),
  difficulty: integer("difficulty").notNull(),
  durationMin: integer("duration_min").notNull(),
  competencies: jsonb("competencies").$type<Competency[]>().notNull(),
  briefing: jsonb("briefing").$type<Briefing>().notNull(),
  objectives: jsonb("objectives").$type<Objective[]>().notNull().default([]),
  openingLine: text("opening_line"),
  maxTurns: integer("max_turns").notNull().default(12),
  casePack: jsonb("case_pack").$type<CasePack>(),
  isPro: boolean("is_pro").notNull().default(false),
});

export const tracks = pgTable("tracks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  competency: text("competency").$type<Competency>().notNull(),
  order: integer("order").notNull(),
});

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  trackId: text("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  level: text("level").$type<Level>().notNull(),
  durationMin: integer("duration_min").notNull(),
  order: integer("order").notNull(),
  blocks: jsonb("blocks").$type<LessonBlock[]>().notNull(),
  practiceScenarioId: text("practice_scenario_id").references(() => scenarios.id),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    quizScore: integer("quiz_score"),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

// ---------- Practice ----------

export const attempts = pgTable("attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scenarioId: text("scenario_id").notNull().references(() => scenarios.id),
  mode: text("mode").$type<"simulation" | "storyboard" | "rehearsal" | "diagnostic">().notNull(),
  targetLevel: text("target_level").$type<Level>().notNull(),
  status: text("status").$type<"in_progress" | "evaluating" | "completed" | "abandoned">().notNull().default("in_progress"),
  mood: text("mood").$type<Mood>().notNull().default("calm"),
  objectivesMet: jsonb("objectives_met").$type<string[]>().notNull().default([]),
  hintsUsed: integer("hints_used").notNull().default(0),
  overallScore: real("overall_score"),
  verdict: text("verdict").$type<Verdict>(),
  /** Set when the attempt retries a single moment of an earlier attempt. */
  retryOfAttemptId: uuid("retry_of_attempt_id"),
  retryFromTurn: integer("retry_from_turn"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [index("attempts_user_idx").on(t.userId, t.startedAt)]);

export const attemptMessages = pgTable("attempt_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  turn: integer("turn").notNull(),
  role: text("role").$type<"user" | "persona">().notNull(),
  content: text("content").notNull(),
  mood: text("mood").$type<Mood>(),
  createdAt: createdAt(),
}, (t) => [index("attempt_messages_attempt_idx").on(t.attemptId, t.turn)]);

export const feedbackReports = pgTable("feedback_reports", {
  attemptId: uuid("attempt_id").primaryKey().references(() => attempts.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  criteria: jsonb("criteria").$type<CriterionScore[]>().notNull(),
  moments: jsonb("moments").$type<FeedbackMoment[]>().notNull(),
  topBehaviours: jsonb("top_behaviours").$type<string[]>().notNull(),
  competencyDeltas: jsonb("competency_deltas").$type<Partial<Record<Competency, number>>>().notNull(),
  readinessBefore: integer("readiness_before").notNull(),
  readinessAfter: integer("readiness_after").notNull(),
  createdAt: createdAt(),
});

export const storyboards = pgTable("storyboards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scenarioId: text("scenario_id").notNull().references(() => scenarios.id),
  attemptId: uuid("attempt_id").references(() => attempts.id, { onDelete: "set null" }),
  stage: text("stage").$type<"pyramid" | "ghost_deck" | "review">().notNull().default("pyramid"),
  pyramid: jsonb("pyramid").$type<PyramidNode | null>(),
  slides: jsonb("slides").$type<GhostSlide[]>().notNull().default([]),
  comments: jsonb("comments").$type<StudioComment[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("storyboards_user_idx").on(t.userId, t.scenarioId)]);

export const redPenReviews = pgTable("red_pen_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deliverableType: text("deliverable_type").$type<"steerco_deck" | "client_email" | "memo" | "exec_summary">().notNull(),
  targetLevel: text("target_level").$type<Level>().notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  result: jsonb("result").$type<RedPenResult>(),
  createdAt: createdAt(),
}, (t) => [index("red_pen_reviews_user_idx").on(t.userId, t.createdAt)]);

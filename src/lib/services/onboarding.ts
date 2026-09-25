import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { COMPETENCIES, COMPETENCY_LABELS, biggestGap, type Competency, type Level } from "@/lib/competency";
import type { User } from "@/lib/auth";
import { titleQuiz } from "@/content/diagnostic";
import type { PlanWeek } from "@/lib/types";
import { getScores, readinessSummary, type Scores } from "./progress";

export function diagnosticQuestions() {
  return titleQuiz.map(({ id, exhibit, options }) => ({ id, exhibit, options }));
}

export interface OnboardingInput {
  currentLevel: Level;
  targetLevel?: Level;
  goal: "promotion" | "break_in" | "sharpen_skill";
  targetDate?: string;
  selfRatings: Record<Competency, number>;
  quizAnswers: Record<string, number>;
}

/**
 * Initial placement. Scores already earned from the diagnostic simulation are
 * kept; the title quiz sets storyboarding/output quality; anything left falls
 * back to the self-rating, discounted because people over-rate themselves.
 */
export function initialScores(existing: Scores, input: Pick<OnboardingInput, "selfRatings" | "quizAnswers">): Scores {
  const correct = titleQuiz.filter((q) => input.quizAnswers[q.id] === q.answerIndex).length;
  const quizScore = 1.5 + (correct / titleQuiz.length) * 2.5; // 1.5 – 4.0
  const scores: Scores = {};
  for (const c of COMPETENCIES) {
    if (existing[c] != null) scores[c] = existing[c];
    else if (c === "storyboarding" || c === "output_quality") scores[c] = round1((quizScore + discount(input.selfRatings[c])) / 2);
    else scores[c] = discount(input.selfRatings[c]);
  }
  return scores;
}

const discount = (selfRating: number) => Math.max(1, round1(selfRating - 0.5));
const round1 = (n: number) => Math.round(n * 10) / 10;

export async function completeOnboarding(user: User, input: OnboardingInput) {
  const scores = initialScores(await getScores(user.id), input);

  for (const c of COMPETENCIES) {
    const score = scores[c]!;
    const selfRating = input.selfRatings[c];
    await db
      .insert(schema.competencyScores)
      .values({ userId: user.id, competency: c, score, selfRating })
      .onConflictDoUpdate({
        target: [schema.competencyScores.userId, schema.competencyScores.competency],
        set: { score, selfRating, updatedAt: new Date() },
      });
    await db.insert(schema.competencyHistory).values({ userId: user.id, competency: c, score });
  }

  const [updated] = await db
    .update(schema.users)
    .set({
      currentLevel: input.currentLevel,
      targetLevel: input.targetLevel ?? null,
      goal: input.goal,
      targetDate: input.targetDate ?? null,
      onboardedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id))
    .returning();

  const plan = await generatePlan(updated, scores);
  const focus = biggestGap(scores);

  return {
    readiness: readinessSummary(updated, scores),
    selfRatings: input.selfRatings,
    focus,
    plan,
  };
}

/** Rule-based 4-week plan: two weeks on the biggest gap, one on the second, one mixed. */
export async function generatePlan(user: User, scores: Scores) {
  const ordered = [...COMPETENCIES].sort((a, b) => (scores[a] ?? 0) - (scores[b] ?? 0));
  const [first, second] = ordered;

  const [tracks, lessons, scenarios] = await Promise.all([
    db.query.tracks.findMany(),
    db.query.lessons.findMany({ orderBy: [schema.lessons.order] }),
    db.query.scenarios.findMany(),
  ]);
  const trackComp = new Map(tracks.map((t) => [t.id, t.competency]));
  const lessonsFor = (c: Competency) => lessons.filter((l) => trackComp.get(l.trackId) === c);
  const scenariosFor = (c: Competency) => scenarios.filter((s) => s.competencies.includes(c) && !s.isPro);

  const item = (kind: "lesson" | "scenario", x: { id: string; title: string }) => ({ kind, refId: x.id, title: x.title });
  const weeks: PlanWeek[] = [
    {
      week: 1,
      theme: `Foundations: ${label(first)}`,
      items: [...lessonsFor(first).slice(0, 2).map((l) => item("lesson", l)), ...scenariosFor(first).slice(0, 1).map((s) => item("scenario", s))],
    },
    { week: 2, theme: `Reps: ${label(first)}`, items: scenariosFor(first).slice(0, 3).map((s) => item("scenario", s)) },
    {
      week: 3,
      theme: `Next gap: ${label(second)}`,
      items: [...lessonsFor(second).slice(0, 1).map((l) => item("lesson", l)), ...scenariosFor(second).slice(0, 2).map((s) => item("scenario", s))],
    },
    {
      week: 4,
      theme: "Put it together",
      items: scenarios.filter((s) => s.kind === "storyboard" || s.competencies.includes(first)).slice(0, 3).map((s) => item("scenario", s)),
    },
  ];

  await db
    .update(schema.developmentPlans)
    .set({ active: false })
    .where(and(eq(schema.developmentPlans.userId, user.id), eq(schema.developmentPlans.active, true)));
  const [plan] = await db.insert(schema.developmentPlans).values({ userId: user.id, focus: first, weeks }).returning();
  return plan;
}

const label = (c: Competency) => COMPETENCY_LABELS[c];

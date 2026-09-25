import "server-only";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  COMPETENCIES,
  LEVELS,
  LEVEL_BAR,
  biggestGap,
  blendScore,
  nextLevel,
  readinessPercent,
  verdictFor,
  type Competency,
  type Level,
} from "@/lib/competency";
import type { User } from "@/lib/auth";
import type { CriterionScore } from "@/lib/types";

export type Scores = Partial<Record<Competency, number>>;

export async function getScores(userId: string): Promise<Scores> {
  const rows = await db.select().from(schema.competencyScores).where(eq(schema.competencyScores.userId, userId));
  return Object.fromEntries(rows.map((r) => [r.competency, r.score]));
}

/** The level a user is working toward: their explicit target, else the next level up. */
export function targetLevelFor(user: Pick<User, "currentLevel" | "targetLevel">): Level {
  return user.targetLevel ?? nextLevel(user.currentLevel) ?? user.currentLevel;
}

/**
 * Rubric scores are relative to the attempt's level. Convert to the user's
 * target level: each level of difference is worth one point on the scale.
 */
export function normalizeToLevel(score: number, attemptLevel: Level, userTarget: Level): number {
  const diff = LEVELS.indexOf(userTarget) - LEVELS.indexOf(attemptLevel);
  return Math.max(1, Math.min(5, score - diff));
}

/** Mean rubric score per competency touched by an attempt. */
export function competencyMeans(criteria: CriterionScore[]): Scores {
  const sums = new Map<Competency, { total: number; n: number }>();
  for (const c of criteria) {
    const s = sums.get(c.competency) ?? { total: 0, n: 0 };
    sums.set(c.competency, { total: s.total + c.score, n: s.n + 1 });
  }
  return Object.fromEntries([...sums].map(([k, v]) => [k, v.total / v.n]));
}

/** Blend an attempt's scores into the user's running scores and record history. */
export async function applyAttemptScores(user: User, attemptId: string, attemptLevel: Level, criteria: CriterionScore[]) {
  const target = targetLevelFor(user);
  const before = await getScores(user.id);
  const after: Scores = { ...before };
  const deltas: Scores = {};

  for (const [competency, mean] of Object.entries(competencyMeans(criteria)) as [Competency, number][]) {
    const normalized = normalizeToLevel(mean, attemptLevel, target);
    const blended = blendScore(before[competency], normalized);
    after[competency] = blended;
    deltas[competency] = Math.round((blended - (before[competency] ?? 0)) * 10) / 10;

    await db
      .insert(schema.competencyScores)
      .values({ userId: user.id, competency, score: blended })
      .onConflictDoUpdate({
        target: [schema.competencyScores.userId, schema.competencyScores.competency],
        set: { score: blended, updatedAt: new Date() },
      });
    await db.insert(schema.competencyHistory).values({ userId: user.id, competency, score: blended, attemptId });
  }

  return { deltas, readinessBefore: readinessPercent(before), readinessAfter: readinessPercent(after) };
}

export function readinessSummary(user: User, scores: Scores) {
  const target = targetLevelFor(user);
  return {
    currentLevel: user.currentLevel,
    targetLevel: target,
    percent: readinessPercent(scores),
    bar: LEVEL_BAR,
    competencies: COMPETENCIES.map((c) => ({
      competency: c,
      score: scores[c] ?? null,
      verdict: scores[c] == null ? null : verdictFor(scores[c]),
    })),
  };
}

function startOfWeek(d = new Date()) {
  const s = new Date(d);
  const day = (s.getUTCDay() + 6) % 7; // Monday = 0
  s.setUTCDate(s.getUTCDate() - day);
  s.setUTCHours(0, 0, 0, 0);
  return s;
}

/** Consecutive days (ending today or yesterday) with at least one completed rep. */
export function streakDays(completedDates: Date[], today = new Date()): number {
  const days = new Set(completedDates.map((d) => d.toISOString().slice(0, 10)));
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/** Where the front end routes each scenario kind. */
export function scenarioHref(s: { id: string; kind: string }) {
  return s.kind === "storyboard" ? `/studio/new?case=${s.id}` : `/practice?start=${s.id}`;
}

/** Lightweight numbers for the app shell's top bar. */
export async function getShellData(user: User) {
  const scores = await getScores(user.id);
  const completed = await db
    .select({ completedAt: schema.attempts.completedAt })
    .from(schema.attempts)
    .where(and(eq(schema.attempts.userId, user.id), eq(schema.attempts.status, "completed")));
  return {
    name: user.name,
    currentLevel: user.currentLevel,
    targetLevel: targetLevelFor(user),
    readiness: readinessPercent(scores),
    streakDays: streakDays(completed.map((a) => a.completedAt!).filter(Boolean)),
  };
}

export async function getDashboard(user: User) {
  const scores = await getScores(user.id);
  const gap = biggestGap(scores);
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [recentAttempts, scenarios, personas, plan, tracks, lessons, done] = await Promise.all([
    db.query.attempts.findMany({
      where: and(eq(schema.attempts.userId, user.id), gte(schema.attempts.startedAt, since)),
      orderBy: desc(schema.attempts.startedAt),
    }),
    db.query.scenarios.findMany(),
    db.query.personas.findMany(),
    db.query.developmentPlans.findFirst({
      where: and(eq(schema.developmentPlans.userId, user.id), eq(schema.developmentPlans.active, true)),
      orderBy: desc(schema.developmentPlans.createdAt),
    }),
    db.query.tracks.findMany({ orderBy: schema.tracks.order }),
    db.query.lessons.findMany({ orderBy: [schema.lessons.trackId, schema.lessons.order] }),
    db.select({ lessonId: schema.lessonProgress.lessonId }).from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, user.id)),
  ]);

  const completed = recentAttempts.filter((a) => a.status === "completed" && a.completedAt);
  const weekStart = startOfWeek();
  const attemptedIds = new Set(recentAttempts.map((a) => a.scenarioId));
  const completedScenarioIds = new Set(completed.map((a) => a.scenarioId));

  // Today's rep: a scenario that trains the biggest gap, preferring ones not yet tried.
  const candidates = scenarios.filter((s) => s.competencies.includes(gap) && !s.isPro);
  const todaysRep = candidates.find((s) => !attemptedIds.has(s.id)) ?? candidates[0] ?? scenarios[0] ?? null;
  const repPersona = todaysRep?.personaId ? personas.find((p) => p.id === todaysRep.personaId) : undefined;

  const doneIds = new Set(done.map((d) => d.lessonId));
  const byId = new Map(scenarios.map((s) => [s.id, s]));
  const trackById = new Map(tracks.map((t) => [t.id, t]));

  // Mon–Sun of the current week: did the user complete a rep that day?
  const todayIdx = (new Date().getUTCDay() + 6) % 7;
  const repDays = new Set(completed.filter((a) => a.completedAt! >= weekStart).map((a) => (a.completedAt!.getUTCDay() + 6) % 7));
  const days = ["M", "T", "W", "T", "F", "S", "S"].map((label, i) => ({
    label,
    state: repDays.has(i) ? "done" : i === todayIdx ? "today" : i < todayIdx ? "missed" : "upcoming",
  }));

  const planWeeks = plan?.weeks.map((w) => ({
    ...w,
    items: w.items.map((it) => {
      const s = it.kind === "scenario" ? byId.get(it.refId) : undefined;
      return {
        ...it,
        done: it.kind === "lesson" ? doneIds.has(it.refId) : completedScenarioIds.has(it.refId),
        href: it.kind === "lesson" ? `/learn/${it.refId}` : s ? scenarioHref(s) : "/practice",
        mode: s?.kind ?? "lesson",
        durationMin: s?.durationMin ?? lessons.find((l) => l.id === it.refId)?.durationMin ?? null,
      };
    }),
  }));
  const currentWeek = planWeeks?.find((w) => w.items.some((i) => !i.done))?.week ?? null;

  return {
    readiness: readinessSummary(user, scores),
    targetDate: user.targetDate,
    gap: { competency: gap, score: scores[gap] ?? null },
    todaysRep: todaysRep && {
      scenario: publicScenario(todaysRep),
      persona: repPersona ? publicPersona(repPersona) : null,
      whatGoodLooksLike: todaysRep.briefing.whatGoodLooksLike[todaysRep.targetLevel] ?? null,
      href: scenarioHref(todaysRep),
    },
    week: {
      goal: user.weeklyRepGoal,
      done: completed.filter((a) => a.completedAt! >= weekStart).length,
      streakDays: streakDays(completed.map((a) => a.completedAt!)),
      days,
    },
    plan: plan ? { id: plan.id, focus: plan.focus, weeks: planWeeks!, currentWeek } : null,
    recentFeedback: completed.slice(0, 3).map((a) => ({
      attemptId: a.id,
      scenarioTitle: byId.get(a.scenarioId)?.title ?? a.scenarioId,
      mode: a.mode,
      overallScore: a.overallScore,
      verdict: a.verdict,
      completedAt: a.completedAt,
    })),
    continueLearning: lessons
      .filter((l) => !doneIds.has(l.id))
      .slice(0, 6)
      .map((l) => {
        const inTrack = lessons.filter((x) => x.trackId === l.trackId);
        const track = trackById.get(l.trackId);
        return {
          ...publicLessonSummary(l),
          trackTitle: track?.title ?? l.trackId,
          competency: track?.competency ?? null,
          position: inTrack.findIndex((x) => x.id === l.id) + 1,
          trackLength: inTrack.length,
          trackProgress: inTrack.filter((x) => doneIds.has(x.id)).length / inTrack.length,
        };
      }),
  };
}

export async function getProgress(user: User) {
  const scores = await getScores(user.id);
  const twelveWeeksAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000);
  const [history, attempts] = await Promise.all([
    db
      .select()
      .from(schema.competencyHistory)
      .where(and(eq(schema.competencyHistory.userId, user.id), gte(schema.competencyHistory.createdAt, twelveWeeksAgo)))
      .orderBy(schema.competencyHistory.createdAt),
    db.query.attempts.findMany({
      where: and(eq(schema.attempts.userId, user.id), inArray(schema.attempts.status, ["completed"])),
      orderBy: desc(schema.attempts.completedAt),
      limit: 100,
    }),
  ]);
  const scenarioRows = await db.query.scenarios.findMany();
  const titles = new Map(scenarioRows.map((s) => [s.id, s.title]));

  // Promotion readiness: every competency at the bar in each of the last 3 reps that touched it.
  const lastThree = new Map<Competency, number[]>();
  for (const h of [...history].reverse()) {
    if (!h.attemptId) continue; // onboarding placement isn't a rep
    const arr = lastThree.get(h.competency) ?? [];
    if (arr.length < 3) arr.push(h.score);
    lastThree.set(h.competency, arr);
  }

  return {
    readiness: readinessSummary(user, scores),
    trend: history.map((h) => ({ competency: h.competency, score: h.score, at: h.createdAt })),
    attempts: attempts.map((a) => ({
      attemptId: a.id,
      scenarioId: a.scenarioId,
      scenarioTitle: titles.get(a.scenarioId) ?? a.scenarioId,
      mode: a.mode,
      targetLevel: a.targetLevel,
      overallScore: a.overallScore,
      verdict: a.verdict,
      completedAt: a.completedAt,
    })),
    promotionChecklist: COMPETENCIES.map((c) => {
      const recent = lastThree.get(c) ?? [];
      return { competency: c, recentScores: recent, met: recent.length === 3 && recent.every((s) => s >= LEVEL_BAR) };
    }),
  };
}

// ---------- Public projections (never expose hidden persona briefs) ----------

export function publicScenario(s: typeof schema.scenarios.$inferSelect) {
  return {
    id: s.id,
    kind: s.kind,
    title: s.title,
    summary: s.summary,
    personaId: s.personaId,
    targetLevel: s.targetLevel,
    difficulty: s.difficulty,
    durationMin: s.durationMin,
    competencies: s.competencies,
    isPro: s.isPro,
  };
}

export function publicPersona(p: typeof schema.personas.$inferSelect) {
  return { id: p.id, name: p.name, title: p.title, company: p.company, personality: p.personality, avatarKey: p.avatarKey };
}

export function publicLessonSummary(l: typeof schema.lessons.$inferSelect) {
  return { id: l.id, trackId: l.trackId, title: l.title, level: l.level, durationMin: l.durationMin };
}

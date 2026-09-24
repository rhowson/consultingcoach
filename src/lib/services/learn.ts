import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "@/lib/auth";
import { notFound } from "@/lib/api/http";
import { publicLessonSummary } from "./progress";

export async function listTracks(user: User) {
  const [tracks, lessons, done] = await Promise.all([
    db.query.tracks.findMany({ orderBy: schema.tracks.order }),
    db.query.lessons.findMany({ orderBy: schema.lessons.order }),
    db.select().from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, user.id)),
  ]);
  const doneIds = new Set(done.map((d) => d.lessonId));
  return tracks.map((t) => {
    const ls = lessons.filter((l) => l.trackId === t.id);
    return {
      ...t,
      lessonCount: ls.length,
      durationMin: ls.reduce((s, l) => s + l.durationMin, 0),
      completedCount: ls.filter((l) => doneIds.has(l.id)).length,
      lessons: ls.map((l) => ({ ...publicLessonSummary(l), completed: doneIds.has(l.id) })),
    };
  });
}

export async function getLesson(user: User, id: string) {
  const lesson = await db.query.lessons.findFirst({ where: eq(schema.lessons.id, id) });
  if (!lesson) throw notFound("Lesson");
  const progress = await db.query.lessonProgress.findFirst({
    where: and(eq(schema.lessonProgress.userId, user.id), eq(schema.lessonProgress.lessonId, id)),
  });
  const practice = lesson.practiceScenarioId
    ? await db.query.scenarios.findFirst({ where: eq(schema.scenarios.id, lesson.practiceScenarioId) })
    : null;
  return {
    ...lesson,
    completed: !!progress,
    quizScore: progress?.quizScore ?? null,
    practice: practice ? { id: practice.id, kind: practice.kind, title: practice.title, durationMin: practice.durationMin } : null,
  };
}

export async function completeLesson(user: User, id: string, quizScore?: number) {
  const lesson = await db.query.lessons.findFirst({ where: eq(schema.lessons.id, id) });
  if (!lesson) throw notFound("Lesson");
  await db
    .insert(schema.lessonProgress)
    .values({ userId: user.id, lessonId: id, quizScore: quizScore ?? null })
    .onConflictDoUpdate({
      target: [schema.lessonProgress.userId, schema.lessonProgress.lessonId],
      set: { quizScore: quizScore ?? null, completedAt: new Date() },
    });
  return { lessonId: id, completed: true };
}

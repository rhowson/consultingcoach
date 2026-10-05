import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePageUser } from "@/lib/page-auth";
import { publicPersona, publicScenario, targetLevelFor } from "@/lib/services/progress";
import { STAGES } from "@/components/studio/model";
import { PracticeHub, type HubScenario } from "@/components/practice/practice-hub";
import type { HubStoryboard } from "@/components/practice/storyline-list";

export const metadata = { title: "Practice · Consulting Coach" };

export default async function PracticePage() {
  const user = await requirePageUser();

  const [rows, personas, attempts, boards] = await Promise.all([
    // Retired scenarios are loaded too, so old storyboards keep their case title.
    db.query.scenarios.findMany(),
    db.query.personas.findMany(),
    db.query.attempts.findMany({
      where: and(eq(schema.attempts.userId, user.id), eq(schema.attempts.status, "completed")),
      columns: { scenarioId: true, overallScore: true },
    }),
    db.query.storyboards.findMany({
      where: eq(schema.storyboards.userId, user.id),
      orderBy: desc(schema.storyboards.updatedAt),
      columns: { id: true, scenarioId: true, stage: true, attemptId: true, updatedAt: true },
    }),
  ]);

  const best = new Map<string, number>();
  for (const a of attempts) {
    if (a.overallScore != null) best.set(a.scenarioId, Math.max(best.get(a.scenarioId) ?? 0, a.overallScore));
  }
  const personaById = new Map(personas.map((p) => [p.id, publicPersona(p)]));
  const titleById = new Map(rows.map((s) => [s.id, s.title]));

  const scenarios: HubScenario[] = rows
    .filter((s) => s.active)
    .map((s) => ({
      ...publicScenario(s),
      persona: s.personaId ? (personaById.get(s.personaId) ?? null) : null,
      bestScore: best.get(s.id) ?? null,
    }));

  const date = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const storyboards: HubStoryboard[] = boards.map((b) => ({
    id: b.id,
    title: titleById.get(b.scenarioId) ?? "Storyline",
    attemptId: b.attemptId,
    status: b.attemptId ? `Submitted ${date(b.updatedAt)}` : `Draft · ${STAGES.find((s) => s.key === b.stage)?.label ?? b.stage} · Updated ${date(b.updatedAt)}`,
  }));

  return <PracticeHub scenarios={scenarios} storyboards={storyboards} targetLevel={targetLevelFor(user)} />;
}

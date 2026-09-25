import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePageUser } from "@/lib/page-auth";
import { publicPersona, publicScenario, targetLevelFor } from "@/lib/services/progress";
import { PracticeHub, type HubScenario } from "@/components/practice/practice-hub";

export const metadata = { title: "Practice · Consulting Coach" };

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ start?: string | string[] }> }) {
  const user = await requirePageUser();
  const { start } = await searchParams;

  const [rows, personas, attempts] = await Promise.all([
    db.query.scenarios.findMany(),
    db.query.personas.findMany(),
    db.query.attempts.findMany({ where: and(eq(schema.attempts.userId, user.id), eq(schema.attempts.status, "completed")) }),
  ]);

  const best = new Map<string, number>();
  for (const a of attempts) {
    if (a.overallScore != null) best.set(a.scenarioId, Math.max(best.get(a.scenarioId) ?? 0, a.overallScore));
  }
  const personaById = new Map(personas.map((p) => [p.id, publicPersona(p)]));

  const scenarios: HubScenario[] = rows.map((s) => ({
    ...publicScenario(s),
    persona: s.personaId ? (personaById.get(s.personaId) ?? null) : null,
    bestScore: best.get(s.id) ?? null,
  }));

  return <PracticeHub scenarios={scenarios} targetLevel={targetLevelFor(user)} initialStart={typeof start === "string" ? start : null} />;
}

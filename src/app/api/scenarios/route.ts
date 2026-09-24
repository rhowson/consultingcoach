import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { json, requireUser, route } from "@/lib/api/http";
import { publicScenario } from "@/lib/services/progress";

/** GET /api/scenarios?kind=simulation&competency=client_management&level=manager */
export const GET = route(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const competency = url.searchParams.get("competency");
  const level = url.searchParams.get("level");

  const [rows, attempts] = await Promise.all([
    db.query.scenarios.findMany(),
    db.query.attempts.findMany({
      where: and(eq(schema.attempts.userId, user.id), eq(schema.attempts.status, "completed")),
    }),
  ]);
  const best = new Map<string, number>();
  for (const a of attempts) {
    if (a.overallScore != null) best.set(a.scenarioId, Math.max(best.get(a.scenarioId) ?? 0, a.overallScore));
  }

  const scenarios = rows
    .filter((s) => !kind || s.kind === kind)
    .filter((s) => !competency || (s.competencies as string[]).includes(competency))
    .filter((s) => !level || s.targetLevel === level)
    .map((s) => ({ ...publicScenario(s), bestScore: best.get(s.id) ?? null, attempted: best.has(s.id) }));
  return json({ scenarios });
});

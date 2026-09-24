import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { json, notFound, requireUser, route } from "@/lib/api/http";
import { publicPersona, publicScenario } from "@/lib/services/progress";

type Ctx = { params: Promise<{ id: string }> };

/** Scenario detail for the briefing drawer: briefing, objectives, rubric. Never the persona's hidden brief. */
export const GET = route<Ctx>(async (_req, { params }) => {
  await requireUser();
  const { id } = await params;
  const s = await db.query.scenarios.findFirst({ where: eq(schema.scenarios.id, id) });
  if (!s) throw notFound("Scenario");
  const [persona, rubric] = await Promise.all([
    s.personaId ? db.query.personas.findFirst({ where: eq(schema.personas.id, s.personaId) }) : null,
    db.query.rubrics.findFirst({ where: eq(schema.rubrics.id, s.rubricId) }),
  ]);
  return json({
    scenario: { ...publicScenario(s), briefing: s.briefing, objectives: s.objectives, maxTurns: s.maxTurns },
    persona: persona ? publicPersona(persona) : null,
    rubric: rubric ? { id: rubric.id, name: rubric.name, criteria: rubric.criteria } : null,
  });
});

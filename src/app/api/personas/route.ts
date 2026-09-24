import { db } from "@/db";
import { json, requireUser, route } from "@/lib/api/http";
import { publicPersona } from "@/lib/services/progress";

export const GET = route(async () => {
  await requireUser();
  return json({ personas: (await db.query.personas.findMany()).map(publicPersona) });
});

import { z } from "zod";
import { LEVELS } from "@/lib/competency";
import { json, parseBody, requireUser, route } from "@/lib/api/http";
import { startSimulation } from "@/lib/services/attempts";

const Body = z.object({
  scenarioId: z.string(),
  targetLevel: z.enum(LEVELS).optional(),
  /** Retry a single moment: copy the transcript of `retryOf` up to your turn `fromTurn`. */
  retryOf: z.uuid().optional(),
  fromTurn: z.number().int().min(1).optional(),
});

export const POST = route(async (req) => {
  const user = await requireUser();
  return json(await startSimulation(user, await parseBody(req, Body)), { status: 201 });
});

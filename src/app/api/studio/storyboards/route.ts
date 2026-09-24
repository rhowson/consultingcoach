import { z } from "zod";
import { json, parseBody, requireUser, route } from "@/lib/api/http";
import { openStoryboard } from "@/lib/services/studio";

/** Open (or resume) the user's draft storyboard for a case. */
export const POST = route(async (req) => {
  const user = await requireUser();
  const { scenarioId } = await parseBody(req, z.object({ scenarioId: z.string() }));
  return json({ storyboard: await openStoryboard(user, scenarioId) });
});

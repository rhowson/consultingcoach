import { json, requireUser, route } from "@/lib/api/http";
import { completeSimulation } from "@/lib/services/attempts";

type Ctx = { params: Promise<{ id: string }> };

// Evaluation + coaching can take a while with a live model.
export const maxDuration = 300;

/** End the conversation and generate the feedback report. Idempotent once completed. */
export const POST = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  return json(await completeSimulation(user, (await params).id));
});

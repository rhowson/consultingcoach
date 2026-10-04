import { json, requireAssessor, route } from "@/lib/api/http";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { rescore } from "@/lib/services/interviews";

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 300;

export const POST = route<Ctx>(async (_req, { params }) => {
  const assessor = await requireAssessor();
  checkRateLimit(assessor.id, "evaluate");
  return json(await rescore((await params).id));
});

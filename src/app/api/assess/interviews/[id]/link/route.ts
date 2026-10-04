import { json, requireAssessor, route } from "@/lib/api/http";
import { regenerateLink } from "@/lib/services/interviews";

type Ctx = { params: Promise<{ id: string }> };

/** Issue a new candidate link (invalidates the old one). Only before the candidate starts. */
export const POST = route<Ctx>(async (_req, { params }) => {
  await requireAssessor();
  return json(await regenerateLink((await params).id));
});

import { json, requireUser, route } from "@/lib/api/http";
import { submitStoryboard } from "@/lib/services/studio";

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 300;

/** Submit for scoring. Returns the feedback report (same shape as GET /api/feedback/:attemptId). */
export const POST = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  return json(await submitStoryboard(user, (await params).id));
});

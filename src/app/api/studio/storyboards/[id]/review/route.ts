import { json, requireUser, route } from "@/lib/api/http";
import { reviewStoryboard } from "@/lib/services/studio";

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 120;

/** "Ask for review": returns the storyboard with fresh coach comments pinned to nodes/slides. */
export const POST = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  return json({ storyboard: await reviewStoryboard(user, (await params).id) });
});

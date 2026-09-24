import { json, requireUser, route } from "@/lib/api/http";
import { deleteReview, getReview } from "@/lib/services/redpen";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  return json({ review: await getReview(user, (await params).id) });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  return json(await deleteReview(user, (await params).id));
});

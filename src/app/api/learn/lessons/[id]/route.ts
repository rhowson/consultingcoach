import { json, requireUser, route } from "@/lib/api/http";
import { getLesson } from "@/lib/services/learn";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  return json({ lesson: await getLesson(user, (await params).id) });
});

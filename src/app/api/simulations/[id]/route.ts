import { json, requireUser, route } from "@/lib/api/http";
import { getAttemptView } from "@/lib/services/attempts";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  return json(await getAttemptView(user, (await params).id));
});

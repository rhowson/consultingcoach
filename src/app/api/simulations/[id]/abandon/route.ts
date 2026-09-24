import { json, requireUser, route } from "@/lib/api/http";
import { abandonAttempt } from "@/lib/services/attempts";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  return json({ attempt: await abandonAttempt(user, (await params).id) });
});

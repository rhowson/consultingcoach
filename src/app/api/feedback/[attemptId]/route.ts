import { json, requireUser, route } from "@/lib/api/http";
import { getReport } from "@/lib/services/attempts";

type Ctx = { params: Promise<{ attemptId: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  return json(await getReport(user, (await params).attemptId));
});

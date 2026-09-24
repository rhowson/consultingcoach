import { json, requireUser, route } from "@/lib/api/http";
import { listCases } from "@/lib/services/studio";

export const GET = route(async () => {
  await requireUser();
  return json({ cases: await listCases() });
});

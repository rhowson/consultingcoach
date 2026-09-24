import { json, requireUser, route } from "@/lib/api/http";
import { getProgress } from "@/lib/services/progress";

export const GET = route(async () => json(await getProgress(await requireUser())));

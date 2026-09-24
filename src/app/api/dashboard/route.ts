import { json, requireUser, route } from "@/lib/api/http";
import { getDashboard } from "@/lib/services/progress";

export const GET = route(async () => json(await getDashboard(await requireUser())));

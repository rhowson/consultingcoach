import { json, route } from "@/lib/api/http";
import { giveConsent } from "@/lib/services/interviews";

type Ctx = { params: Promise<{ token: string }> };

export const POST = route<Ctx>(async (_req, { params }) => json(await giveConsent((await params).token)));

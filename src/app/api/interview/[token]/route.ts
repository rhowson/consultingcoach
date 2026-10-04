import { json, route } from "@/lib/api/http";
import { candidateView } from "@/lib/services/interviews";

type Ctx = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";

/** Candidate state. The link token is the credential — no account needed. */
export const GET = route<Ctx>(async (_req, { params }) => json(await candidateView((await params).token)));

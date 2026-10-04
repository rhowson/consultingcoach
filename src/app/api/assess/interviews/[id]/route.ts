import { z } from "zod";
import { json, parseBody, requireAssessor, route } from "@/lib/api/http";
import { deleteInterview, getInterviewReport, updateInterview } from "@/lib/services/interviews";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAssessor();
  return json(await getInterviewReport((await params).id));
});

const Patch = z.object({ assessorNotes: z.string().max(10_000).optional(), revoke: z.boolean().optional() });

export const PATCH = route<Ctx>(async (req, { params }) => {
  await requireAssessor();
  return json(await updateInterview((await params).id, await parseBody(req, Patch)));
});

/** Deletes the interview and everything recorded in it (candidate data removal). */
export const DELETE = route<Ctx>(async (_req, { params }) => {
  await requireAssessor();
  return json(await deleteInterview((await params).id));
});

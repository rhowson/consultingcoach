import { z } from "zod";
import { LEVELS } from "@/lib/competency";
import { json, parseBody, requireAssessor, route } from "@/lib/api/http";
import { createInterview, listInterviews } from "@/lib/services/interviews";
import { assessmentPacks } from "@/content/assessment";

export const GET = route(async () => {
  await requireAssessor();
  return json({
    interviews: await listInterviews(),
    packs: assessmentPacks.map((p) => ({ id: p.id, title: p.title, summary: p.summary, totalMin: p.totalMin })),
  });
});

const Body = z.object({
  candidateName: z.string().trim().min(1).max(120),
  candidateEmail: z.email().max(200).optional().or(z.literal("")),
  targetLevel: z.enum(LEVELS),
  packId: z.string().max(60),
});

/** Returns the one-time link token. It is never shown again (only its hash is stored). */
export const POST = route(async (req) => {
  const assessor = await requireAssessor();
  const body = await parseBody(req, Body);
  return json(await createInterview(assessor, { ...body, candidateEmail: body.candidateEmail || undefined }), { status: 201 });
});

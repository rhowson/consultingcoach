import { z } from "zod";
import { LEVELS } from "@/lib/competency";
import { json, parseBody, requireUser, route } from "@/lib/api/http";
import { createReview, listReviews } from "@/lib/services/redpen";

export const maxDuration = 120;

export const GET = route(async () => json({ reviews: await listReviews(await requireUser()) }));

const Body = z.object({
  title: z.string().min(1).max(200),
  /** Plain text of the deliverable. File parsing (PPTX/PDF/DOCX) is not implemented yet. */
  content: z.string().min(20).max(60_000),
  deliverableType: z.enum(["steerco_deck", "client_email", "memo", "exec_summary"]),
  targetLevel: z.enum(LEVELS),
});

export const POST = route(async (req) => {
  const user = await requireUser();
  return json({ review: await createReview(user, await parseBody(req, Body)) }, { status: 201 });
});

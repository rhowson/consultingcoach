import { z } from "zod";
import { json, parseBody, route } from "@/lib/api/http";
import { saveAnswers } from "@/lib/services/interviews";

type Ctx = { params: Promise<{ token: string; sectionId: string }> };

const Body = z.object({ answers: z.record(z.string(), z.string().max(8000)), submit: z.boolean().default(false) });

/** Autosave (submit: false) or submit the section (submit: true). Rejected after the deadline. */
export const PUT = route<Ctx>(async (req, { params }) => {
  const { token, sectionId } = await params;
  const { answers, submit } = await parseBody(req, Body);
  return json(await saveAnswers(token, sectionId, answers, submit));
});

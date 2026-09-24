import { z } from "zod";
import { json, parseBody, requireUser, route } from "@/lib/api/http";
import { completeLesson } from "@/lib/services/learn";

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({ quizScore: z.number().int().min(0).max(100).optional() });

export const POST = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { quizScore } = await parseBody(req, Body);
  return json(await completeLesson(user, (await params).id, quizScore));
});

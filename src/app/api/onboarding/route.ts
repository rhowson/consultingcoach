import { z } from "zod";
import { COMPETENCIES, LEVELS, type Competency } from "@/lib/competency";
import { json, parseBody, requireUser, route } from "@/lib/api/http";
import { completeOnboarding, diagnosticQuestions } from "@/lib/services/onboarding";

/** Diagnostic content for the onboarding wizard. The mini-simulation uses POST /api/simulations. */
export const GET = route(async () => {
  await requireUser();
  return json({ diagnosticScenarioId: "savings-number-wrong", diagnosticMaxTurns: 3, titleQuiz: diagnosticQuestions() });
});

const rating = z.number().min(1).max(5);
const Body = z.object({
  currentLevel: z.enum(LEVELS),
  targetLevel: z.enum(LEVELS).optional(),
  goal: z.enum(["promotion", "break_in", "sharpen_skill"]),
  targetDate: z.iso.date().optional(),
  selfRatings: z.object(Object.fromEntries(COMPETENCIES.map((c) => [c, rating])) as Record<Competency, typeof rating>),
  quizAnswers: z.record(z.string(), z.number().int()),
});

export const POST = route(async (req) => {
  const user = await requireUser();
  return json(await completeOnboarding(user, await parseBody(req, Body)));
});

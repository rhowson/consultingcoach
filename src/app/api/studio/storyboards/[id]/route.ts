import { z } from "zod";
import { json, parseBody, requireUser, route } from "@/lib/api/http";
import { getStoryboard, saveStoryboard } from "@/lib/services/studio";
import type { PyramidNode } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  return json({ storyboard: await getStoryboard(user, (await params).id) });
});

const PyramidNodeSchema: z.ZodType<PyramidNode> = z.lazy(() =>
  z.object({ id: z.string().min(1).max(64), text: z.string().max(500), children: z.array(PyramidNodeSchema).max(8) }),
);

const Patch = z.object({
  stage: z.enum(["pyramid", "ghost_deck", "review"]).optional(),
  pyramid: PyramidNodeSchema.nullable().optional(),
  slides: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        actionTitle: z.string().max(300),
        slideType: z.enum(["chart", "table", "text", "framework"]),
        exhibitId: z.string().max(32).optional(),
        chartType: z.string().max(40).optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .max(20)
    .optional(),
});

/** Autosave. Send only the fields that changed. */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  return json({ storyboard: await saveStoryboard(user, (await params).id, await parseBody(req, Patch)) });
});

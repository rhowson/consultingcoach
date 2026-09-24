import { z } from "zod";
import { json, parseBody, requireUser, route } from "@/lib/api/http";
import { resolveComment } from "@/lib/services/studio";

type Ctx = { params: Promise<{ id: string; commentId: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id, commentId } = await params;
  const { resolved } = await parseBody(req, z.object({ resolved: z.boolean() }));
  return json({ storyboard: await resolveComment(user, id, commentId, resolved) });
});

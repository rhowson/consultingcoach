import { z } from "zod";
import { json, parseBody, route } from "@/lib/api/http";
import { askAssistant } from "@/lib/services/interviews";

type Ctx = { params: Promise<{ token: string }> };

const Body = z.object({ message: z.string().max(4000) });

/** The guarded case assistant. Only works while the AI section is open. */
export const POST = route<Ctx>(async (req, { params }) => {
  const { message } = await parseBody(req, Body);
  return json(await askAssistant((await params).token, message));
});

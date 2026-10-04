import { z } from "zod";
import { json, parseBody, route } from "@/lib/api/http";
import { sendClientMessage } from "@/lib/services/interviews";

type Ctx = { params: Promise<{ token: string }> };

const Body = z.object({ message: z.string().max(4000) });

export const POST = route<Ctx>(async (req, { params }) => {
  const { message } = await parseBody(req, Body);
  return json(await sendClientMessage((await params).token, message));
});

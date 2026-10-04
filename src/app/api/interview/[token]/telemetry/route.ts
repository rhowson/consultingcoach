import { z } from "zod";
import { json, parseBody, route } from "@/lib/api/http";
import { recordTelemetry } from "@/lib/services/interviews";

type Ctx = { params: Promise<{ token: string }> };

const Body = z.object({
  events: z
    .array(z.object({ type: z.string().max(30), sectionId: z.string().max(10).optional(), meta: z.record(z.string(), z.union([z.string().max(100), z.number()])).optional() }))
    .max(50),
});

/** Integrity signals (pastes, blocked copies, time away from the tab). Shown to assessors, never used to auto-fail. */
export const POST = route<Ctx>(async (req, { params }) => {
  const { events } = await parseBody(req, Body);
  return json(await recordTelemetry((await params).token, events));
});

import { z } from "zod";
import { parseBody, requireUser, route } from "@/lib/api/http";
import { prepareMessage } from "@/lib/services/attempts";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

const Body = z.object({ content: z.string().trim().min(1).max(4000) });

/**
 * Send the consultant's message. Responds with Server-Sent Events:
 *   event: user_message     data: { turn }
 *   event: delta            data: { text }          (persona reply, streamed)
 *   event: persona_message  data: { turn, content }
 *   event: signals          data: { mood, objectivesMet, ended }
 *   event: error            data: { message }
 */
export const POST = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { content } = await parseBody(req, Body);
  // Validation errors (closed session, awaiting reply) throw here, before the stream opens.
  const events = await prepareMessage(user, (await params).id, content);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const e of events) {
          const { type, ...data } = e;
          controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
        }
      } catch (err) {
        console.error(err);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: "Something went wrong" })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
});

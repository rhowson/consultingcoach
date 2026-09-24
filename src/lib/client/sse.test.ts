import { describe, expect, it } from "vitest";
import { parseEvent, readSse } from "./sse";

describe("SSE reader", () => {
  it("parses events split across chunks", async () => {
    const chunks = ['event: delta\ndata: {"text":"Hel', 'lo"}\n\nevent: signals\ndata: {"mood":"calm"}\n\n'];
    const body = new ReadableStream({
      start(c) {
        for (const ch of chunks) c.enqueue(new TextEncoder().encode(ch));
        c.close();
      },
    });
    const events = [];
    for await (const e of readSse(new Response(body))) events.push(e);
    expect(events).toEqual([
      { event: "delta", data: { text: "Hello" } },
      { event: "signals", data: { mood: "calm" } },
    ]);
  });

  it("ignores comment-only frames", () => {
    expect(parseEvent(": keep-alive")).toBeNull();
  });
});

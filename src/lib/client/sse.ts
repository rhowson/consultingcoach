/**
 * Minimal Server-Sent Events reader for POST responses (EventSource only does GET).
 * Yields { event, data } with `data` JSON-parsed.
 */
export async function* readSse<T = unknown>(res: Response): AsyncGenerator<{ event: string; data: T }> {
  if (!res.body) return;
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const parsed = parseEvent<T>(raw);
      if (parsed) yield parsed;
    }
  }
}

export function parseEvent<T>(raw: string): { event: string; data: T } | null {
  let event = "message";
  const data: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (!data.length) return null;
  return { event, data: JSON.parse(data.join("\n")) as T };
}

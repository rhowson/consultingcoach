import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { env } from "@/lib/env";

type Effort = "low" | "medium" | "high";

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic();
  return client;
}

/**
 * Every request opts into server-side refusal fallbacks: if the model's safety
 * classifiers decline a request, the API re-runs it on Anthropic's recommended
 * fallback model inside the same call.
 */
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

export class AiRefusalError extends Error {
  constructor(public category: string | null | undefined) {
    super("The AI declined to respond to this request");
  }
}

/** One-shot call that returns JSON validated against a Zod schema. */
export async function generateStructured<S extends z.ZodType>(opts: {
  system: string;
  prompt: string;
  schema: S;
  effort?: Effort;
}): Promise<z.infer<S>> {
  const response = await getClient().beta.messages.parse({
    ...FALLBACK,
    model: env.AI_MODEL,
    max_tokens: 16000,
    cache_control: { type: "ephemeral" },
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
    output_config: { effort: opts.effort ?? "high", format: betaZodOutputFormat(opts.schema) },
  });
  if (response.stop_reason === "refusal") throw new AiRefusalError(response.stop_details?.category);
  if (response.parsed_output == null) throw new Error(`Structured output missing (stop_reason=${response.stop_reason})`);
  return response.parsed_output as z.infer<S>;
}

/** Streams plain text for a multi-turn conversation. Yields text deltas as they arrive. */
export async function* streamText(opts: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  effort?: Effort;
  maxTokens?: number;
}): AsyncGenerator<string> {
  const stream = getClient().beta.messages.stream({
    ...FALLBACK,
    model: env.AI_MODEL,
    max_tokens: opts.maxTokens ?? 2000,
    cache_control: { type: "ephemeral" },
    system: opts.system,
    messages: opts.messages,
    output_config: { effort: opts.effort ?? "low" },
  });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") throw new AiRefusalError(final.stop_details?.category);
}

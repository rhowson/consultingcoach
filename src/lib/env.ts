import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().default("postgres://coach:coach@localhost:5432/consultingcoach"),
  AUTH_SECRET: z.string().min(16).optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("claude-opus-5"),
  AI_MOCK: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = schema.parse(process.env);

/** Session signing key. Required in production; a fixed dev key is used otherwise. */
export function authSecret(): Uint8Array {
  if (env.AUTH_SECRET) return new TextEncoder().encode(env.AUTH_SECRET);
  if (env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set in production");
  return new TextEncoder().encode("dev-only-secret-not-for-production");
}

/** Mock mode runs the AI engine on scripted responses so the app works without an API key. */
export const aiMockMode = env.AI_MOCK === "1" || !env.ANTHROPIC_API_KEY;

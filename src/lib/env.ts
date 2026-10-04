import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().default("postgres://coach:coach@localhost:5432/consultingcoach"),
  AUTH_SECRET: z.string().min(16).optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("claude-opus-5"),
  AI_MOCK: z.string().optional(),
  /** When set, new accounts need this code to sign up (invite-only assessments). */
  SIGNUP_ACCESS_CODE: z.string().optional(),
  /** Comma-separated emails allowed to run interview assessments and see candidate reports. */
  ASSESSOR_EMAILS: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = schema.parse(process.env);

/** Session signing key. Required in production; a fixed dev key is used otherwise. */
export function authSecret(): Uint8Array {
  if (env.AUTH_SECRET) return new TextEncoder().encode(env.AUTH_SECRET);
  if (env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set in production");
  return new TextEncoder().encode("dev-only-secret-not-for-production");
}

/**
 * How the AI engine runs:
 * - "live": Claude API (ANTHROPIC_API_KEY set).
 * - "mock": scripted responses and heuristic scores. Only when AI_MOCK=1, or in development without a key.
 * - "off": production without a key. AI features return a clear error rather than fake scores —
 *   the app is used for assessments, so a missing key must never produce simulated results.
 */
export const aiMode: "live" | "mock" | "off" =
  env.AI_MOCK === "1" ? "mock" : env.ANTHROPIC_API_KEY ? "live" : env.NODE_ENV === "production" ? "off" : "mock";

export const aiMockMode = aiMode === "mock";

/** Recorded on every feedback report so a score can be traced to what produced it. */
export const scoringModel = aiMode === "mock" ? "mock" : env.AI_MODEL;

/** Assessors can create interviews and read candidate reports. Configured by email so it can't be self-granted. */
export function isAssessorEmail(email: string) {
  const list = (env.ASSESSOR_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

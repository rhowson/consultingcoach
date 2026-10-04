import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getCurrentUser, type User } from "@/lib/auth";
import { AiRefusalError, AiUnavailableError } from "@/lib/ai/client";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "error",
  ) {
    super(message);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids come from URLs; a malformed one is simply "not found", not a database error. */
export function isUuid(id: string) {
  return UUID.test(id);
}

export const notFound = (what = "Resource") => new HttpError(404, `${what} not found`, "not_found");
export const badRequest = (message: string) => new HttpError(400, message, "bad_request");

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Sign in required", "unauthorized");
  return user;
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw badRequest("Body must be valid JSON");
  }
  return schema.parse(json);
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler with consistent JSON error responses: { error: { code, message } }. */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: { code: "validation_error", message: "Invalid request", issues: err.issues } },
          { status: 422 },
        );
      }
      if (err instanceof AiUnavailableError) {
        return NextResponse.json(
          { error: { code: "ai_misconfigured", message: "The AI coach isn't available yet — an administrator needs to finish setting it up." } },
          { status: 503 },
        );
      }
      if (err instanceof AiRefusalError) {
        return NextResponse.json(
          { error: { code: "ai_refused", message: "The AI coach couldn't respond to that. Try rephrasing." } },
          { status: 422 },
        );
      }
      if (err instanceof Anthropic.APIError) {
        // Auth/permission problems are configuration errors (bad or missing key); everything else is transient.
        console.error(`Claude API error ${err.status}:`, err.message);
        const config = err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError;
        return NextResponse.json(
          {
            error: {
              code: config ? "ai_misconfigured" : "ai_unavailable",
              message: config ? "The AI coach isn't configured correctly." : "The AI coach is busy right now — please try again in a moment.",
            },
          },
          { status: config ? 503 : 502 },
        );
      }
      console.error(err);
      return NextResponse.json({ error: { code: "internal", message: "Something went wrong" } }, { status: 500 });
    }
  };
}

export const json = NextResponse.json;

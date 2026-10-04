import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { createSession, hashPassword, publicUser } from "@/lib/auth";
import { timingSafeEqual } from "node:crypto";
import { HttpError, json, parseBody, route } from "@/lib/api/http";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { clientIp } from "@/lib/api/client-ip";
import { env } from "@/lib/env";

const Body = z.object({
  email: z.email().transform((s) => s.toLowerCase().trim()),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(1).max(100),
  accessCode: z.string().max(200).optional(),
});

function codeMatches(given: string | undefined, expected: string) {
  const a = Buffer.from(given ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const POST = route(async (req) => {
  checkRateLimit(`ip:${clientIp(req)}`, "signup");
  const body = await parseBody(req, Body);
  if (env.SIGNUP_ACCESS_CODE && !codeMatches(body.accessCode?.trim(), env.SIGNUP_ACCESS_CODE)) {
    throw new HttpError(403, "That access code isn't valid. Ask your administrator for the code.", "invalid_access_code");
  }
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, body.email) });
  if (existing) throw new HttpError(409, "An account with this email already exists", "email_taken");
  const [user] = await db
    .insert(schema.users)
    .values({ email: body.email, name: body.name, passwordHash: await hashPassword(body.password) })
    .returning();
  await createSession(user.id);
  return json({ user: publicUser(user) }, { status: 201 });
});

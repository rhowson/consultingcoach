import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { createSession, publicUser, verifyPassword } from "@/lib/auth";
import { HttpError, json, parseBody, route } from "@/lib/api/http";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { clientIp } from "@/lib/api/client-ip";
import { afterFailure, lockRemainingMs, lockoutMessage } from "@/lib/login-guard";

const Body = z.object({ email: z.string().transform((s) => s.toLowerCase().trim()), password: z.string() });

export const POST = route(async (req) => {
  // Per-IP cap first, so guessing across many emails is throttled too.
  checkRateLimit(`ip:${clientIp(req)}`, "login");
  const body = await parseBody(req, Body);
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, body.email) });
  if (!user) throw new HttpError(401, "Email or password is incorrect", "invalid_credentials");

  // A locked account isn't checked at all, so a correct guess during lockout reveals nothing.
  const remaining = lockRemainingMs(user);
  if (remaining > 0) throw new HttpError(429, lockoutMessage(remaining), "account_locked");

  if (!(await verifyPassword(body.password, user.passwordHash))) {
    const next = afterFailure(user);
    await db
      .update(schema.users)
      .set({ failedLoginCount: next.failedLoginCount, lockedUntil: next.lockedUntil })
      .where(eq(schema.users.id, user.id));
    if (next.lockedNow) throw new HttpError(429, lockoutMessage(lockRemainingMs(next)), "account_locked");
    // Same message as an unknown email, so responses don't reveal which accounts exist.
    throw new HttpError(401, "Email or password is incorrect", "invalid_credentials");
  }

  if (user.failedLoginCount || user.lockedUntil) {
    await db.update(schema.users).set({ failedLoginCount: 0, lockedUntil: null }).where(eq(schema.users.id, user.id));
  }
  await createSession(user.id);
  return json({ user: publicUser(user) });
});

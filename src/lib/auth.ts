import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { authSecret } from "@/lib/env";

const COOKIE = "cc_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(authSecret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret(), { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const id = await getSessionUserId();
  if (!id) return null;
  return (await db.query.users.findFirst({ where: eq(schema.users.id, id) })) ?? null;
}

export type User = typeof schema.users.$inferSelect;

/** Strip secrets before sending a user to the client. */
export function publicUser(u: User) {
  const { passwordHash: _omit, ...rest } = u;
  return rest;
}

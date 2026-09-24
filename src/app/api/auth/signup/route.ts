import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { createSession, hashPassword, publicUser } from "@/lib/auth";
import { HttpError, json, parseBody, route } from "@/lib/api/http";

const Body = z.object({
  email: z.email().transform((s) => s.toLowerCase().trim()),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(100),
});

export const POST = route(async (req) => {
  const body = await parseBody(req, Body);
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, body.email) });
  if (existing) throw new HttpError(409, "An account with this email already exists", "email_taken");
  const [user] = await db
    .insert(schema.users)
    .values({ email: body.email, name: body.name, passwordHash: await hashPassword(body.password) })
    .returning();
  await createSession(user.id);
  return json({ user: publicUser(user) }, { status: 201 });
});

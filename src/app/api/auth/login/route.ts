import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { createSession, publicUser, verifyPassword } from "@/lib/auth";
import { HttpError, json, parseBody, route } from "@/lib/api/http";

const Body = z.object({ email: z.string().transform((s) => s.toLowerCase().trim()), password: z.string() });

export const POST = route(async (req) => {
  const body = await parseBody(req, Body);
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, body.email) });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new HttpError(401, "Email or password is incorrect", "invalid_credentials");
  }
  await createSession(user.id);
  return json({ user: publicUser(user) });
});

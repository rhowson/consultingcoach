import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { destroySession, publicUser } from "@/lib/auth";
import { LEVELS } from "@/lib/competency";
import { json, parseBody, requireUser, route } from "@/lib/api/http";

export const GET = route(async () => json({ user: publicUser(await requireUser()) }));

const Patch = z
  .object({
    name: z.string().min(1).max(100),
    currentLevel: z.enum(LEVELS),
    targetLevel: z.enum(LEVELS).nullable(),
    targetDate: z.iso.date().nullable(),
    weeklyRepGoal: z.number().int().min(1).max(21),
    coachTone: z.enum(["supportive", "direct", "partner"]),
  })
  .partial();

export const PATCH = route(async (req) => {
  const user = await requireUser();
  const patch = await parseBody(req, Patch);
  const [updated] = await db.update(schema.users).set(patch).where(eq(schema.users.id, user.id)).returning();
  return json({ user: publicUser(updated) });
});

/** Deletes the account and everything it owns (cascades). */
export const DELETE = route(async () => {
  const user = await requireUser();
  await db.delete(schema.users).where(eq(schema.users.id, user.id));
  await destroySession();
  return json({ deleted: true });
});

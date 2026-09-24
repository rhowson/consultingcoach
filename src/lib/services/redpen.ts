import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "@/lib/auth";
import { notFound } from "@/lib/api/http";
import * as engine from "@/lib/ai/engine";
import type { Level } from "@/lib/competency";

type DeliverableType = (typeof schema.redPenReviews.$inferSelect)["deliverableType"];

export async function createReview(
  user: User,
  input: { title: string; content: string; deliverableType: DeliverableType; targetLevel: Level },
) {
  const result = await engine.redPen(input.content, input.deliverableType, input.targetLevel, user.coachTone);
  const [row] = await db
    .insert(schema.redPenReviews)
    .values({
      userId: user.id,
      ...input,
      result: { ...result, annotations: result.annotations.map((a) => ({ ...a, id: randomUUID() })) },
    })
    .returning();
  return row;
}

export async function listReviews(user: User) {
  const rows = await db.query.redPenReviews.findMany({
    where: eq(schema.redPenReviews.userId, user.id),
    orderBy: desc(schema.redPenReviews.createdAt),
    limit: 50,
  });
  return rows.map(({ content: _omit, ...r }) => r);
}

export async function getReview(user: User, id: string) {
  const row = await db.query.redPenReviews.findFirst({
    where: and(eq(schema.redPenReviews.id, id), eq(schema.redPenReviews.userId, user.id)),
  });
  if (!row) throw notFound("Review");
  return row;
}

export async function deleteReview(user: User, id: string) {
  await getReview(user, id);
  await db.delete(schema.redPenReviews).where(eq(schema.redPenReviews.id, id));
  return { deleted: true };
}

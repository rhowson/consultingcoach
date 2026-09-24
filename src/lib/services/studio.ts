import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "@/lib/auth";
import { HttpError, badRequest, notFound } from "@/lib/api/http";
import * as engine from "@/lib/ai/engine";
import type { GhostSlide, PyramidNode, StudioComment } from "@/lib/types";
import { finalizeAttempt } from "./attempts";
import { publicScenario } from "./progress";

type Storyboard = typeof schema.storyboards.$inferSelect;

async function loadCase(scenarioId: string) {
  const scenario = await db.query.scenarios.findFirst({ where: eq(schema.scenarios.id, scenarioId) });
  if (!scenario || scenario.kind !== "storyboard" || !scenario.casePack) throw notFound("Case");
  return scenario;
}

async function loadOwned(user: User, id: string) {
  const sb = await db.query.storyboards.findFirst({
    where: and(eq(schema.storyboards.id, id), eq(schema.storyboards.userId, user.id)),
  });
  if (!sb) throw notFound("Storyboard");
  return sb;
}

export async function listCases() {
  const rows = await db.query.scenarios.findMany({ where: eq(schema.scenarios.kind, "storyboard") });
  return rows.map(publicScenario);
}

/** Returns the user's open draft for a case, creating one if needed. */
export async function openStoryboard(user: User, scenarioId: string) {
  const scenario = await loadCase(scenarioId);
  let sb = await db.query.storyboards.findFirst({
    where: and(
      eq(schema.storyboards.userId, user.id),
      eq(schema.storyboards.scenarioId, scenarioId),
      isNull(schema.storyboards.attemptId),
    ),
    orderBy: desc(schema.storyboards.updatedAt),
  });
  if (!sb) {
    [sb] = await db
      .insert(schema.storyboards)
      .values({ userId: user.id, scenarioId, pyramid: { id: "gt", text: "", children: [] } })
      .returning();
  }
  return view(sb, scenario);
}

export async function getStoryboard(user: User, id: string) {
  const sb = await loadOwned(user, id);
  return view(sb, await loadCase(sb.scenarioId));
}

export async function saveStoryboard(
  user: User,
  id: string,
  patch: { stage?: Storyboard["stage"]; pyramid?: PyramidNode | null; slides?: GhostSlide[] },
) {
  const sb = await loadOwned(user, id);
  if (sb.attemptId) throw new HttpError(409, "This storyboard has been submitted", "submitted");
  const [updated] = await db
    .update(schema.storyboards)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.storyboards.id, id))
    .returning();
  return view(updated, await loadCase(sb.scenarioId));
}

/** "Ask for review": coach comments pinned to nodes/slides. Replaces unresolved comments. */
export async function reviewStoryboard(user: User, id: string) {
  const sb = await loadOwned(user, id);
  const scenario = await loadCase(sb.scenarioId);
  if (!sb.pyramid?.text && !sb.slides.length) throw badRequest("Add a governing thought or slides before asking for review");

  const review = await engine.reviewStoryboard(scenario.casePack!, sb.pyramid, sb.slides, sb.stage, scenario.targetLevel, user.coachTone);
  const comments: StudioComment[] = [
    ...sb.comments.filter((c) => c.resolved),
    ...review.comments.map((c) => ({ ...c, id: randomUUID(), resolved: false })),
  ];
  const [updated] = await db
    .update(schema.storyboards)
    .set({ comments, updatedAt: new Date() })
    .where(eq(schema.storyboards.id, id))
    .returning();
  return view(updated, scenario);
}

export async function resolveComment(user: User, id: string, commentId: string, resolved: boolean) {
  const sb = await loadOwned(user, id);
  if (!sb.comments.some((c) => c.id === commentId)) throw notFound("Comment");
  const comments = sb.comments.map((c) => (c.id === commentId ? { ...c, resolved } : c));
  const [updated] = await db.update(schema.storyboards).set({ comments }).where(eq(schema.storyboards.id, id)).returning();
  return view(updated, await loadCase(sb.scenarioId));
}

/** Submit for scoring: creates an attempt and runs the shared evaluator → coach pipeline. */
export async function submitStoryboard(user: User, id: string) {
  const sb = await loadOwned(user, id);
  if (sb.attemptId) throw new HttpError(409, "Already submitted", "submitted");
  const scenario = await loadCase(sb.scenarioId);
  if (!sb.pyramid?.text || sb.slides.length === 0) throw badRequest("A governing thought and at least one slide are required");

  const [attempt] = await db
    .insert(schema.attempts)
    .values({ userId: user.id, scenarioId: scenario.id, mode: "storyboard", targetLevel: scenario.targetLevel })
    .returning();
  await db.update(schema.storyboards).set({ attemptId: attempt.id }).where(eq(schema.storyboards.id, id));

  try {
    return await finalizeAttempt(user, attempt, scenario, engine.storyboardWork(scenario.casePack!, sb.pyramid, sb.slides));
  } catch (err) {
    // Unlink so the draft can be resubmitted.
    await db.update(schema.storyboards).set({ attemptId: null }).where(eq(schema.storyboards.id, id));
    await db.delete(schema.attempts).where(eq(schema.attempts.id, attempt.id));
    throw err;
  }
}

function view(sb: Storyboard, scenario: typeof schema.scenarios.$inferSelect) {
  return {
    id: sb.id,
    stage: sb.stage,
    pyramid: sb.pyramid,
    slides: sb.slides,
    comments: sb.comments,
    attemptId: sb.attemptId,
    updatedAt: sb.updatedAt,
    case: { ...publicScenario(scenario), briefing: scenario.briefing, casePack: scenario.casePack },
  };
}

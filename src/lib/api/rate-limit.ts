import { HttpError } from "./http";

/**
 * Per-user fixed-window limits for endpoints that call Claude. In-memory, so
 * they reset on deploy and are per instance — enough to stop one account
 * running up the API bill on a single-instance deployment.
 */
const LIMITS = {
  message: { max: 30, windowMs: 60_000 }, // simulator turns
  evaluate: { max: 20, windowMs: 60 * 60_000 }, // feedback reports, studio submit
  review: { max: 30, windowMs: 60 * 60_000 }, // studio "ask for review", red pen
} as const;

export type LimitKind = keyof typeof LIMITS;

const windows = new Map<string, { start: number; count: number }>();

export function checkRateLimit(userId: string, kind: LimitKind, now = Date.now()) {
  const { max, windowMs } = LIMITS[kind];
  const key = `${kind}:${userId}`;
  const w = windows.get(key);
  if (!w || now - w.start >= windowMs) {
    windows.set(key, { start: now, count: 1 });
    return;
  }
  if (w.count >= max) {
    const retryS = Math.ceil((w.start + windowMs - now) / 1000);
    throw new HttpError(429, `You're going a bit fast — try again in ${retryS < 60 ? `${retryS}s` : `${Math.ceil(retryS / 60)} min`}.`, "rate_limited");
  }
  w.count++;
}

/** Test helper. */
export function resetRateLimits() {
  windows.clear();
}

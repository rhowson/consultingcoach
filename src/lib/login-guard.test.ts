import { describe, expect, it } from "vitest";
import { LOCKOUT_MS, MAX_FAILED_LOGINS, afterFailure, lockRemainingMs, lockoutMessage } from "./login-guard";

const now = new Date("2026-10-04T12:00:00Z");

describe("login lockout", () => {
  it("counts failures and locks on the 5th", () => {
    let state = { failedLoginCount: 0, lockedUntil: null as Date | null };
    for (let i = 1; i < MAX_FAILED_LOGINS; i++) {
      const next = afterFailure(state, now);
      expect(next.lockedNow).toBe(false);
      expect(next.failedLoginCount).toBe(i);
      state = next;
    }
    const locked = afterFailure(state, now);
    expect(locked.lockedNow).toBe(true);
    expect(lockRemainingMs(locked, now)).toBe(LOCKOUT_MS);
  });

  it("starts a fresh count once the lockout has expired", () => {
    const expired = { failedLoginCount: 0, lockedUntil: new Date(now.getTime() - 1000) };
    expect(lockRemainingMs(expired, now)).toBe(0);
    expect(afterFailure(expired, now)).toMatchObject({ failedLoginCount: 1, lockedNow: false, lockedUntil: null });
  });

  it("rounds the message up to whole minutes", () => {
    expect(lockoutMessage(LOCKOUT_MS)).toContain("15 minutes");
    expect(lockoutMessage(10_000)).toContain("1 minute.");
  });
});

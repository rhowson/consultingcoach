/**
 * Account lockout policy for sign-in. Pure so it can be unit-tested; the
 * login route applies the resulting state to the database.
 */
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MS = 15 * 60_000;

export interface LoginState {
  failedLoginCount: number;
  lockedUntil: Date | null;
}

/** Remaining lockout in ms, or 0 if the account can try to sign in. */
export function lockRemainingMs(state: LoginState, now = new Date()) {
  return state.lockedUntil ? Math.max(0, state.lockedUntil.getTime() - now.getTime()) : 0;
}

/** State after a wrong password. The attempt that reaches the limit starts the lockout. */
export function afterFailure(state: LoginState, now = new Date()): LoginState & { lockedNow: boolean } {
  // An expired lockout starts a fresh count.
  const count = (lockRemainingMs(state, now) === 0 && state.lockedUntil ? 0 : state.failedLoginCount) + 1;
  if (count >= MAX_FAILED_LOGINS) {
    return { failedLoginCount: 0, lockedUntil: new Date(now.getTime() + LOCKOUT_MS), lockedNow: true };
  }
  return { failedLoginCount: count, lockedUntil: null, lockedNow: false };
}

export function lockoutMessage(remainingMs: number) {
  const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  return `Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

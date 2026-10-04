import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "./rate-limit";
import { HttpError } from "./http";

describe("checkRateLimit", () => {
  beforeEach(resetRateLimits);

  it("allows up to the limit, then rejects with 429 until the window resets", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 30; i++) checkRateLimit("u1", "message", t0);
    let err: unknown;
    try {
      checkRateLimit("u1", "message", t0 + 1000);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(429);
    expect(() => checkRateLimit("u1", "message", t0 + 60_000)).not.toThrow();
  });

  it("keeps users and kinds separate", () => {
    for (let i = 0; i < 30; i++) checkRateLimit("u1", "message", 0);
    expect(() => checkRateLimit("u2", "message", 0)).not.toThrow();
    expect(() => checkRateLimit("u1", "review", 0)).not.toThrow();
  });
});

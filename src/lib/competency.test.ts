import { describe, expect, it } from "vitest";
import { biggestGap, blendScore, nextLevel, readinessPercent, verdictFor } from "./competency";

describe("competency model", () => {
  it("steps through levels", () => {
    expect(nextLevel("analyst")).toBe("consultant");
    expect(nextLevel("director")).toBeNull();
  });

  it("classifies verdicts against the 3.5 bar", () => {
    expect(verdictFor(3.5)).toBe("meets");
    expect(verdictFor(2.5)).toBe("approaching");
    expect(verdictFor(2.4)).toBe("below");
  });

  it("caps readiness per competency so strengths can't hide gaps", () => {
    const allAtBar = { problem_solving: 3.5, storyboarding: 3.5, client_management: 3.5, difficult_conversations: 3.5, output_quality: 3.5 };
    expect(readinessPercent(allAtBar)).toBe(100);
    expect(readinessPercent({ ...allAtBar, problem_solving: 5, difficult_conversations: 2 })).toBe(80);
    expect(readinessPercent({})).toBe(0);
  });

  it("blends new scores with an EMA", () => {
    expect(blendScore(null, 4)).toBe(4);
    expect(blendScore(2, 4)).toBe(2.6);
  });

  it("finds the lowest competency", () => {
    expect(biggestGap({ problem_solving: 3.8, storyboarding: 3.4, client_management: 3.1, difficult_conversations: 2.4, output_quality: 3.6 })).toBe(
      "difficult_conversations",
    );
  });
});

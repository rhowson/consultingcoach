import { describe, expect, it } from "vitest";
import { initialScores } from "./onboarding";

const selfRatings = { problem_solving: 4, storyboarding: 4, client_management: 3, difficult_conversations: 2, output_quality: 4 };

describe("initialScores", () => {
  it("discounts self-ratings and blends in the title quiz", () => {
    const scores = initialScores({}, { selfRatings, quizAnswers: { q1: 2, q2: 0 } });
    expect(scores.problem_solving).toBe(3.5);
    expect(scores.difficult_conversations).toBe(1.5);
    expect(scores.storyboarding).toBe(3.8); // (4.0 quiz + 3.5 self) / 2 → 3.75 → 3.8
  });

  it("keeps scores already earned in the diagnostic simulation", () => {
    const scores = initialScores({ difficult_conversations: 2.9 }, { selfRatings, quizAnswers: {} });
    expect(scores.difficult_conversations).toBe(2.9);
  });
});

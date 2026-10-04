import { describe, expect, it } from "vitest";
import { competencyMeans, normalizeToLevel, streakDays, targetLevelFor, ukDayKey, ukWeekStartKey } from "./progress";

describe("progress helpers", () => {
  it("normalizes rubric scores to the user's target level", () => {
    expect(normalizeToLevel(4, "manager", "manager")).toBe(4);
    expect(normalizeToLevel(4, "consultant", "manager")).toBe(3); // easier scenario counts for less
    expect(normalizeToLevel(3, "director", "manager")).toBe(4); // harder scenario counts for more
    expect(normalizeToLevel(1, "analyst", "director")).toBe(1); // clamped
  });

  it("averages criteria per competency", () => {
    const means = competencyMeans([
      { criterionId: "a", label: "A", competency: "client_management", score: 4, rationale: "" },
      { criterionId: "b", label: "B", competency: "client_management", score: 2, rationale: "" },
      { criterionId: "c", label: "C", competency: "difficult_conversations", score: 3, rationale: "" },
    ]);
    expect(means).toEqual({ client_management: 3, difficult_conversations: 3 });
  });

  it("targets the next level unless one is set", () => {
    expect(targetLevelFor({ currentLevel: "consultant", targetLevel: null })).toBe("manager");
    expect(targetLevelFor({ currentLevel: "consultant", targetLevel: "director" })).toBe("director");
    expect(targetLevelFor({ currentLevel: "director", targetLevel: null })).toBe("director");
  });

  it("counts consecutive days, allowing today to be empty so far", () => {
    const today = new Date("2026-09-24T12:00:00Z");
    const d = (s: string) => new Date(`${s}T09:00:00Z`);
    expect(streakDays([d("2026-09-24"), d("2026-09-23"), d("2026-09-22")], today)).toBe(3);
    expect(streakDays([d("2026-09-23"), d("2026-09-22")], today)).toBe(2);
    expect(streakDays([d("2026-09-21")], today)).toBe(0);
  });

  it("uses UK days, so a rep just after midnight BST counts for the new day", () => {
    // 23:30 UTC on 3 Oct is 00:30 BST on 4 Oct.
    expect(ukDayKey(new Date("2026-10-03T23:30:00Z"))).toBe("2026-10-04");
    expect(ukDayKey(new Date("2026-12-03T23:30:00Z"))).toBe("2026-12-03"); // GMT in winter
    expect(streakDays([new Date("2026-10-03T23:30:00Z")], new Date("2026-10-04T10:00:00Z"))).toBe(1);
  });

  it("starts UK weeks on Monday", () => {
    expect(ukWeekStartKey(new Date("2026-10-04T10:00:00Z"))).toBe("2026-09-28"); // Sunday → previous Monday
    expect(ukWeekStartKey(new Date("2026-10-05T00:30:00+01:00"))).toBe("2026-10-05");
  });
});

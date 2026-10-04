import { describe, expect, it } from "vitest";
import { exhibitBars } from "./exhibit-data";
import { scenarios } from "@/content/scenarios";

const exhibit = (caseId: string, id: string) => scenarios.find((s) => s.id === caseId)!.casePack!.exhibits.find((e) => e.id === id)!;

describe("exhibitBars", () => {
  it("treats 'FY23' as a row label, not the number 23", () => {
    const bars = exhibitBars(exhibit("meridian-data-platform", "E1"));
    expect(bars.map((b) => b.label)).toEqual(["Platform & licences", "Engineering", "Use-case delivery"]);
    expect(Math.max(...bars.map((b) => b.value))).toBeLessThan(5);
  });

  it("reads inline 'Q1 42' cells as values", () => {
    expect(exhibitBars(exhibit("meridian-data-platform", "E4")).map((b) => b.value)).toEqual([42, 55, 61, 58]);
  });

  it("uses one bar per row for two-column tables", () => {
    expect(exhibitBars(exhibit("meridian-data-platform", "E2")).map((b) => b.value)).toEqual([3, 4, 8, 5]);
  });

  it("charts every case-pack exhibit without nonsense values", () => {
    for (const c of scenarios.filter((s) => s.casePack)) {
      for (const e of c.casePack!.exhibits) {
        for (const b of exhibitBars(e)) expect(Number.isFinite(b.value)).toBe(true);
      }
    }
  });
});

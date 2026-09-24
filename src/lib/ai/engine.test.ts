import { describe, expect, it } from "vitest";
import { personas } from "@/content/personas";
import { rubrics, scenarios } from "@/content/scenarios";
import type { PersonaBrief } from "@/lib/types";
import * as engine from "./engine";

// AI_MOCK=1 is set in vitest.config.ts, so these exercise the mock engine end to end.
const persona = { ...personas[1], brief: personas[1].brief as PersonaBrief };
const s = scenarios.find((x) => x.id === "leaked-findings")!;
const scenario = { title: s.title, briefing: s.briefing, objectives: s.objectives!, targetLevel: s.targetLevel };
const rubric = rubrics.find((r) => r.id === s.rubricId)!;

describe("AI engine (mock mode)", () => {
  it("streams a persona reply", async () => {
    let text = "";
    for await (const chunk of engine.streamPersonaReply(persona, scenario, s.openingLine!, [
      { turn: 0, role: "persona", content: s.openingLine! },
      { turn: 1, role: "user", content: "You're right, I'm sorry — you should have heard it from us." },
    ])) {
      text += chunk;
    }
    expect(text.length).toBeGreaterThan(10);
  });

  it("reads empathy as de-escalation and ticks objectives", async () => {
    const signals = await engine.assessTurn(persona, scenario, [
      { turn: 1, role: "user", content: "I'm sorry, you're right. What have you heard?" },
    ]);
    expect(signals.mood).toBe("calm");
    expect(signals.objectivesMet).toEqual(["apologise", "explore"]);
  });

  it("scores every rubric criterion and coaches", async () => {
    const work = engine.simulationWork(persona, scenario, [{ turn: 1, role: "user", content: "But the benchmark data shows it." }]);
    const evaluation = await engine.evaluate(work, "manager", rubric.criteria);
    expect(evaluation.criteria.map((c) => c.criterionId)).toEqual(rubric.criteria.map((c) => c.id));
    const coaching = await engine.coach(work, "manager", evaluation, rubric.criteria, "direct");
    expect(coaching.topBehaviours).toHaveLength(3);
    expect(coaching.moments[0].ref).toBe("1");
  });

  it("flags topic titles in storyboard review", async () => {
    const review = await engine.reviewStoryboard(
      s.casePack ?? scenarios.find((x) => x.kind === "storyboard")!.casePack!,
      { id: "gt", text: "Churn overview", children: [] },
      [{ id: "s1", actionTitle: "Churn", slideType: "chart" }],
      "ghost_deck",
      "consultant",
      "direct",
    );
    expect(review.comments.map((c) => c.targetId)).toEqual(expect.arrayContaining(["gt", "s1"]));
  });
});

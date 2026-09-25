"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BookOpen, Target } from "lucide-react";
import type { OnboardingResult } from "@/lib/client/api";
import { COMPETENCIES, COMPETENCY_LABELS, LEVEL_LABELS, LEVELS, LEVEL_BAR, type Level } from "@/lib/competency";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { LevelBadge } from "@/components/ui/badges";
import { RadarChart } from "./radar-chart";

/** Scores are against the target bar and one point ≈ one level, so the mean places you on the ladder. */
function operatingLevel(mean: number, target: Level): Level {
  const t = LEVELS.indexOf(target);
  const idx = Math.max(0, Math.min(t, t + Math.floor(mean - LEVEL_BAR)));
  return LEVELS[idx];
}

export function ResultView({ result }: { result: OnboardingResult }) {
  const router = useRouter();
  const [going, setGoing] = useState(false);
  const { readiness, selfRatings, focus, plan } = result;
  const placed = Object.fromEntries(readiness.competencies.map((c) => [c.competency, c.score]));
  const scores = readiness.competencies.map((c) => c.score ?? 0);
  const mean = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const level = operatingLevel(mean, readiness.targetLevel);

  function start() {
    setGoing(true);
    router.push("/");
    router.refresh();
  }

  return (
    <section aria-labelledby="step-heading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Eyebrow>Your placement</Eyebrow>
        <h1 id="step-heading" tabIndex={-1} className="m-0 font-serif text-[28px] leading-tight font-semibold tracking-tight outline-none md:text-[32px]">
          You&apos;re operating at {LEVEL_LABELS[level]}; your biggest gap to {LEVEL_LABELS[readiness.targetLevel]} is {COMPETENCY_LABELS[focus]}.
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <LevelBadge level={readiness.currentLevel} solid />
          <ArrowRight size={14} aria-hidden />
          <LevelBadge level={readiness.targetLevel} />
          <span className="tabular font-semibold text-ink">{readiness.percent}% ready</span>
        </div>
      </div>

      <Card className="grid grid-cols-1 items-center gap-6 p-6 md:grid-cols-[1.1fr_1fr]">
        <RadarChart self={selfRatings} placed={placed} />
        <table className="w-full text-sm">
          <caption className="sr-only">Self-rating versus placed score by competency</caption>
          <thead>
            <tr className="text-left text-xs text-muted">
              <th scope="col" className="pb-2 font-semibold">Competency</th>
              <th scope="col" className="pb-2 text-right font-semibold">You said</th>
              <th scope="col" className="pb-2 text-right font-semibold">Placed</th>
            </tr>
          </thead>
          <tbody>
            {COMPETENCIES.map((c) => {
              const p = placed[c];
              return (
                <tr key={c} className={`border-t border-divider ${c === focus ? "font-semibold" : ""}`}>
                  <th scope="row" className="py-2 text-left font-medium">
                    {COMPETENCY_LABELS[c]}
                    {c === focus && <span className="ml-1.5 rounded-full bg-accent-tint px-2 py-px text-[11px] font-semibold text-accent-ink">Focus</span>}
                  </th>
                  <td className="tabular py-2 text-right text-muted">{selfRatings[c]}</td>
                  <td className={`tabular py-2 text-right ${p != null && p >= LEVEL_BAR ? "text-success" : "text-ink"}`}>{p?.toFixed(1) ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card aria-labelledby="plan-title" className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-0.5">
          <CardTitle id="plan-title">Your 4-week plan</CardTitle>
          <span className="text-sm text-muted">Built around closing your {COMPETENCY_LABELS[focus]} gap first.</span>
        </div>
        <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
          {plan.weeks.map((w) => (
            <li key={w.week} className="flex flex-col gap-2 rounded-md border border-border bg-subtle p-4">
              <span className="text-xs font-semibold text-muted">Week {w.week}</span>
              <span className="text-[15px] font-semibold first-letter:uppercase">{w.theme}</span>
              <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] text-ink-2">
                {w.items.map((it) => (
                  <li key={`${it.kind}-${it.refId}`} className="flex items-center gap-1.5">
                    {it.kind === "lesson" ? <BookOpen size={13} className="flex-none text-muted" aria-hidden /> : <Target size={13} className="flex-none text-muted" aria-hidden />}
                    <span className="truncate">{it.title}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={start} disabled={going}>
          Start my plan <ArrowRight size={18} aria-hidden />
        </Button>
      </div>
    </section>
  );
}

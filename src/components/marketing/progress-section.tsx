import { TrendingUp } from "lucide-react";
import { COMPETENCIES, COMPETENCY_LABELS } from "@/lib/competency";
import { CompetencyIcon } from "@/components/ui/icons";
import { CARD, CheckItem, CONTAINER, LIFT, SectionHeading } from "./primitives";

/** Illustrative readiness values (0–100) against a 70 "meets Manager bar" target. */
const SAMPLE: Record<(typeof COMPETENCIES)[number], number> = {
  problem_solving: 78,
  storyboarding: 66,
  client_management: 82,
  difficult_conversations: 48,
  output_quality: 74,
};
const TARGET = 70;

export function ProgressSection() {
  return (
    <section aria-labelledby="progress-title" className="pb-20 sm:pb-28">
      <div className={`${CONTAINER} grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16`}>
        <figure className={`${CARD} ${LIFT} m-0 p-5 sm:p-7`}>
          <figcaption className="sr-only">
            Example competency readiness against the Manager bar: difficult conversations is the main gap at 48%, below the 70% target.
          </figcaption>
          <div aria-hidden>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="eyebrow">Readiness for Manager</span>
                <span className="tabular font-display text-4xl font-semibold tracking-tight text-ink">72%</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-success-tint px-2.5 py-1 text-[12px] font-semibold text-success">
                <TrendingUp size={14} /> +9 pts in 4 weeks
              </span>
            </div>

            <ul className="m-0 mt-7 flex list-none flex-col gap-4 p-0">
              {COMPETENCIES.map((c) => {
                const v = SAMPLE[c];
                const gap = v < TARGET;
                return (
                  <li key={c} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3 text-[13.5px]">
                      <span className="flex min-w-0 items-center gap-2 font-medium text-ink-2">
                        <CompetencyIcon competency={c} size={15} className="shrink-0 text-muted" />
                        <span className="truncate">{COMPETENCY_LABELS[c]}</span>
                      </span>
                      <span className={`tabular font-semibold ${gap ? "text-accent-ink" : "text-ink"}`}>{v}%</span>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-hover">
                      <div className={`h-full rounded-full ${gap ? "bg-accent" : "bg-primary"}`} style={{ width: `${v}%` }} />
                      <span className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-ink" style={{ left: `${TARGET}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-divider pt-4 text-[12px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-primary" /> At or above bar
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-accent" /> Gap to close
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-0.5 rounded-full bg-ink" /> Manager bar
              </span>
            </div>
          </div>
        </figure>

        <div className="flex flex-col gap-8">
          <SectionHeading
            id="progress-title"
            align="left"
            eyebrow="Your progress"
            first="Visualise your progress"
            second="to the next level"
            lede="See where you stand against the level you're aiming for, competency by competency, and what to practise next."
          />
          <ul className="m-0 flex list-none flex-col gap-5 p-0">
            <CheckItem title="Calibrated to Analyst → Director rubrics">Every score uses the bar for the level you&apos;re targeting.</CheckItem>
            <CheckItem title="Competency-level readiness">So a strength can&apos;t hide a gap.</CheckItem>
            <CheckItem title="Weekly plan built from your gaps">Reps chosen for what will move your readiness most.</CheckItem>
          </ul>
        </div>
      </div>
    </section>
  );
}

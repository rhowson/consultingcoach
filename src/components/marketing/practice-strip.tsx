import { BrainCircuit, Cpu, Scale, UsersRound, Workflow, type LucideIcon } from "lucide-react";
import { PRACTICE_AREA_LABELS, type PracticeArea } from "@/lib/practice-areas";
import { CONTAINER } from "./primitives";

const ICONS: Record<PracticeArea, LucideIcon> = {
  enterprise_technology: Cpu,
  data_ai: BrainCircuit,
  programme_delivery: Workflow,
  change_culture: UsersRound,
  commercial_advisory: Scale,
};

/** Practice areas every scenario is drawn from (in place of client logos). */
export function PracticeStrip() {
  const areas = Object.keys(ICONS) as PracticeArea[];
  return (
    <section aria-labelledby="practice-title" className="relative z-10 -mt-4 pb-6 sm:-mt-6">
      <div className={`${CONTAINER} flex flex-col items-center gap-5`}>
        <h2 id="practice-title" className="eyebrow m-0 text-center">
          Cases across five technology &amp; transformation practice areas
        </h2>
        <ul className="m-0 flex list-none flex-wrap justify-center gap-2.5 p-0">
          {areas.map((a) => {
            const Icon = ICONS[a];
            return (
              <li
                key={a}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-2 text-sm font-medium text-ink-2 shadow-sm"
              >
                <Icon size={16} aria-hidden className="text-muted" />
                {PRACTICE_AREA_LABELS[a]}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

import { ChevronRight } from "lucide-react";
import { LEVEL_BAR, verdictFor } from "@/lib/competency";

const BAR_COLOR = { meets: "bg-success", approaching: "bg-warning", below: "bg-danger" } as const;
const BAR_TEXT = { meets: "meets bar", approaching: "approaching", below: "below bar" } as const;

/** One compact score row: criterion, bar with a marker at the level bar, and score. The rationale opens on demand. */
export function RubricScore({ label, score, rationale }: { label: string; score: number; rationale: string }) {
  const v = verdictFor(score);
  return (
    <li className="border-t border-divider first:border-t-0">
      <details className="group">
        <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-md py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <ChevronRight size={16} aria-hidden className="flex-none text-muted transition-transform group-open:rotate-90 print:hidden" />
            {label}
          </span>
          <span aria-hidden className="relative order-last col-span-2 ml-6 h-1.5 rounded-full bg-hover sm:order-none sm:col-span-1 sm:ml-0">
            <span
              className={`absolute inset-y-0 left-0 rounded-full ${BAR_COLOR[v]}`}
              style={{ width: `${(Math.min(Math.max(score, 0), 5) / 5) * 100}%` }}
            />
            <span className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 bg-accent" style={{ left: `${(LEVEL_BAR / 5) * 100}%` }} />
          </span>
          <span className="tabular w-9 text-right text-sm font-semibold">
            {score.toFixed(1)}
            <span className="sr-only"> out of 5, {BAR_TEXT[v]}</span>
          </span>
        </summary>
        <p className="m-0 pb-4 pl-6 text-sm text-ink-2 print:hidden">{rationale}</p>
      </details>
      {/* Closed disclosures don't print, so the printed report carries every rationale. */}
      <p className="m-0 hidden pb-4 pl-6 text-sm text-ink-2 print:block">{rationale}</p>
    </li>
  );
}

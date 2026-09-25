import { COMPETENCY_LABELS, LEVEL_BAR, verdictFor, type Competency } from "@/lib/competency";

const BAR_COLOR = { meets: "bg-success", approaching: "bg-warning", below: "bg-danger" } as const;
const BAR_TEXT = { meets: "Meets bar", approaching: "Approaching", below: "Below bar" } as const;

/** RubricScore row: criterion, score /5, bar with a brass marker at the level bar, rationale. */
export function RubricScore({
  label,
  competency,
  score,
  rationale,
  first = false,
}: {
  label: string;
  competency: Competency;
  score: number;
  rationale: string;
  first?: boolean;
}) {
  const v = verdictFor(score);
  return (
    <div className={`flex flex-col gap-2 py-4 ${first ? "" : "border-t border-border"}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="text-[15px] font-semibold">{label}</span>
          <span className="text-xs text-muted">{COMPETENCY_LABELS[competency]}</span>
        </span>
        <span className="tabular flex-none text-xl font-semibold">
          {score.toFixed(1)}
          <span className="text-[13px] font-normal text-muted"> / 5</span>
          <span className="sr-only">, {BAR_TEXT[v]}</span>
        </span>
      </div>
      <div aria-hidden className="relative h-1.5 rounded-full bg-hover">
        <div className={`absolute inset-y-0 left-0 rounded-full ${BAR_COLOR[v]}`} style={{ width: `${(Math.min(Math.max(score, 0), 5) / 5) * 100}%` }} />
        <div className="absolute -top-[5px] -bottom-[5px] w-0.5 bg-accent" style={{ left: `${(LEVEL_BAR / 5) * 100}%` }} />
      </div>
      <p className="m-0 text-sm text-ink-2">{rationale}</p>
    </div>
  );
}

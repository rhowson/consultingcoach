import { Check, Circle } from "lucide-react";
import { COMPETENCY_LABELS, LEVEL_BAR, LEVEL_LABELS, type Competency, type Level, type Verdict } from "@/lib/competency";
import { Card, CardTitle } from "@/components/ui/card";
import { CompetencyIcon } from "@/components/ui/icons";

const BAR_COLOR: Record<Verdict, string> = { meets: "bg-success", approaching: "bg-warning", below: "bg-danger" };

export interface ReadinessRow {
  competency: Competency;
  score: number | null;
  verdict: Verdict | null;
  /** Most recent rep first, up to three. */
  recentScores: number[];
  met: boolean;
}

/**
 * Readiness for the target level: one row per competency with the current score against the bar,
 * the last three rep scores, and whether the promotion rule is met.
 */
export function ReadinessCard({
  target,
  percent,
  rows,
  empty,
}: {
  target: Level;
  percent: number;
  rows: ReadinessRow[];
  /** Shown in place of the rows before anything has been scored. */
  empty?: React.ReactNode;
}) {
  const met = rows.filter((r) => r.met).length;
  const barPct = (LEVEL_BAR / 5) * 100;

  return (
    <Card aria-labelledby="readiness-title" className="flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <CardTitle id="readiness-title">Readiness for {LEVEL_LABELS[target]}</CardTitle>
        <p className="m-0 flex items-baseline gap-3 text-sm text-muted">
          <span>
            <span className="tabular font-display text-[28px] leading-none font-semibold text-ink">{percent}%</span> ready
          </span>
          <span aria-hidden className="text-faint">
            ·
          </span>
          <span>
            <span className="tabular font-semibold text-ink">{met}</span> of {rows.length} met
          </span>
        </p>
      </div>

      {empty ?? (
        <div className="flex flex-col">
          <div
            aria-hidden
            className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_2.5rem_6.5rem_5.5rem] gap-x-4 border-b border-border pb-2 text-xs font-semibold text-muted sm:grid"
          >
            <span>Competency</span>
            <span className="col-span-2">Current score</span>
            <span>Last 3 reps</span>
            <span>Status</span>
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {rows.map((r) => (
              <li
                key={r.competency}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-2 border-b border-divider py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_2.5rem_6.5rem_5.5rem]"
              >
                <span className="col-start-1 row-start-1 flex min-w-0 items-center gap-2.5 text-sm font-medium sm:col-start-auto sm:row-start-auto">
                  <CompetencyIcon competency={r.competency} size={17} className="flex-none text-muted" />
                  <span className="truncate">{COMPETENCY_LABELS[r.competency]}</span>
                </span>
                <span aria-hidden className="relative col-start-1 row-start-2 h-1.5 rounded-full bg-hover sm:col-start-auto sm:row-start-auto">
                  {r.score != null && r.verdict && (
                    <span className={`absolute inset-y-0 left-0 rounded-full ${BAR_COLOR[r.verdict]}`} style={{ width: `${(Math.min(Math.max(r.score, 0), 5) / 5) * 100}%` }} />
                  )}
                  <span className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 bg-accent" style={{ left: `${barPct}%` }} />
                </span>
                <span className="tabular col-start-2 row-start-1 text-right text-sm font-semibold sm:col-start-auto sm:row-start-auto">
                  <span className="sr-only">Current score </span>
                  {r.score != null ? r.score.toFixed(1) : "—"}
                </span>
                <span className="tabular col-span-2 col-start-2 row-start-2 flex gap-2 text-xs sm:col-span-1 sm:col-start-auto sm:row-start-auto">
                  <span className="sr-only">Last 3 reps, most recent first:</span>
                  {r.recentScores.length === 0 && <span className="text-faint">No reps yet</span>}
                  {r.recentScores.map((s, i) => (
                    <span key={i} className={s >= LEVEL_BAR ? "font-semibold text-success" : "text-muted"}>
                      {s.toFixed(1)}
                    </span>
                  ))}
                </span>
                <span
                  className={`col-start-3 row-start-1 flex items-center gap-1.5 text-xs font-semibold sm:col-start-auto sm:row-start-auto ${r.met ? "text-success" : "text-muted"}`}
                >
                  {r.met ? (
                    <span aria-hidden className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-success text-on-primary">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  ) : (
                    <Circle size={16} aria-hidden className="flex-none text-border-strong" />
                  )}
                  {r.met ? "Met" : "Not yet"}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 flex items-center gap-2 text-xs text-muted">
            <span aria-hidden className="h-3 w-0.5 flex-none bg-accent" />
            {LEVEL_LABELS[target]} bar {LEVEL_BAR}. Met means your last 3 reps all reached it.
          </p>
        </div>
      )}
    </Card>
  );
}

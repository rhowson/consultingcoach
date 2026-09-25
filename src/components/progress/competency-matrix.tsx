import {
  COMPETENCY_LABELS,
  LEVELS,
  LEVEL_BAR,
  LEVEL_EXPECTATIONS,
  LEVEL_LABELS,
  type Competency,
  type Level,
} from "@/lib/competency";
import { CompetencyIcon } from "@/components/ui/icons";

/**
 * Scores are expressed against the target level's bar (3.5), and each level of
 * difference is worth one point. So 3.5+ sits in the target column, 2.5–3.5 in
 * the level below, and so on. `frac` places the marker within the cell.
 */
export function placeScore(score: number, target: Level): { level: Level; frac: number } {
  const t = LEVELS.indexOf(target);
  const steps = Math.floor(score - LEVEL_BAR); // 3.5–4.49 → 0, 2.5–3.49 → -1, 4.5+ → 1
  const idx = Math.max(0, Math.min(LEVELS.length - 1, t + steps));
  let frac = score - LEVEL_BAR - steps; // 0..1 within the band
  if (t + steps < 0) frac = 0.05;
  if (t + steps > LEVELS.length - 1) frac = 0.95;
  return { level: LEVELS[idx], frac: Math.max(0.08, Math.min(0.92, frac)) };
}

export function CompetencyMatrix({
  rows,
  current,
  target,
}: {
  rows: { competency: Competency; score: number | null }[];
  current: Level;
  target: Level;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
        <caption className="sr-only">
          Where each competency sits across the four levels. Your target level is {LEVEL_LABELS[target]}.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="w-[30%] pb-2 text-left text-xs font-semibold text-muted">
              Competency
            </th>
            {LEVELS.map((l) => (
              <th
                key={l}
                scope="col"
                className={`pb-2 text-center text-xs font-semibold ${l === target ? "text-accent-ink" : l === current ? "text-level-consultant" : "text-muted"}`}
              >
                {LEVEL_LABELS[l]}
                {l === target && <span className="block text-[11px] font-medium">Target</span>}
                {l === current && l !== target && <span className="block text-[11px] font-medium">Current</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const pos = r.score != null ? placeScore(r.score, target) : null;
            return (
              <tr key={r.competency}>
                <th scope="row" className="border-t border-divider py-3 pr-3 text-left font-medium">
                  <span className="flex items-center gap-2">
                    <CompetencyIcon competency={r.competency} size={17} className="flex-none text-muted" />
                    {COMPETENCY_LABELS[r.competency]}
                  </span>
                </th>
                {LEVELS.map((l) => {
                  const isTarget = l === target;
                  const here = pos?.level === l;
                  return (
                    <td
                      key={l}
                      title={LEVEL_EXPECTATIONS[r.competency][l]}
                      style={
                        isTarget
                          ? {
                              borderTop: ri === 0 ? "2px solid var(--accent)" : undefined,
                              borderBottom: ri === rows.length - 1 ? "2px solid var(--accent)" : undefined,
                            }
                          : undefined
                      }
                      className={`relative h-12 border-t border-divider p-1 ${isTarget ? "border-x-2 border-x-accent bg-accent-tint/40" : ""}`}
                    >
                      <div className="relative h-full rounded bg-subtle">
                        {here && r.score != null && (
                          <span
                            className="absolute top-1/2 z-[1] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-on-primary shadow-sm"
                            style={{ left: `${pos!.frac * 100}%` }}
                          >
                            <span className="tabular">{r.score.toFixed(1)}</span>
                            <span className="sr-only">
                              {" "}
                              — operating at {LEVEL_LABELS[l]} level
                            </span>
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 mb-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm border-2 border-accent bg-accent-tint/40" aria-hidden /> Target level column
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded-full bg-primary" aria-hidden /> Your score and where it places you
        </span>
        <span>Scores are against the {LEVEL_LABELS[target]} bar of {LEVEL_BAR}; one point ≈ one level.</span>
      </p>
    </div>
  );
}

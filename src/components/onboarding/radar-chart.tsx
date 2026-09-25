import { COMPETENCIES, COMPETENCY_LABELS, LEVEL_BAR, type Competency } from "@/lib/competency";

const SHORT: Record<Competency, [string, string?]> = {
  problem_solving: ["Problem", "solving"],
  storyboarding: ["Storyboarding"],
  client_management: ["Client", "management"],
  difficult_conversations: ["Difficult", "conversations"],
  output_quality: ["Output", "quality"],
};

/** Five-axis radar: self-rating (dashed, brass) vs placed score (solid, primary), with the bar ring. */
export function RadarChart({ self, placed }: { self: Record<Competency, number>; placed: Partial<Record<Competency, number | null>> }) {
  const W = 440;
  const H = 330;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const R = 112;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / COMPETENCIES.length;
  const pt = (i: number, v: number) => {
    const r = (Math.max(0, Math.min(5, v)) / 5) * R;
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))] as const;
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).map((n) => n.toFixed(1)).join(",")).join(" ");
  const selfVals = COMPETENCIES.map((k) => self[k]);
  const placedVals = COMPETENCIES.map((k) => placed[k] ?? 0);

  const label = COMPETENCIES.map((k) => `${COMPETENCY_LABELS[k]}: self ${self[k]}, placed ${(placed[k] ?? 0).toFixed(1)}`).join("; ");

  return (
    <figure className="m-0 flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[440px]" role="img" aria-label={`Self-rating versus placed score. ${label}.`}>
        {[1, 2, 3, 4, 5].map((v) => (
          <polygon key={v} points={poly(COMPETENCIES.map(() => v))} fill="none" stroke="var(--border)" strokeWidth="1" />
        ))}
        <polygon points={poly(COMPETENCIES.map(() => LEVEL_BAR))} fill="none" stroke="var(--accent)" strokeWidth="1.25" strokeDasharray="3 3" />
        {COMPETENCIES.map((_, i) => {
          const [x, y] = pt(i, 5);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" />;
        })}
        <polygon points={poly(selfVals)} fill="var(--accent)" fillOpacity="0.12" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 4" />
        <polygon points={poly(placedVals)} fill="var(--primary)" fillOpacity="0.16" stroke="var(--primary)" strokeWidth="2" />
        {placedVals.map((v, i) => {
          const [x, y] = pt(i, v);
          return <circle key={i} cx={x} cy={y} r="3.5" fill="var(--primary)" />;
        })}
        {selfVals.map((v, i) => {
          const [x, y] = pt(i, v);
          return <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />;
        })}
        {COMPETENCIES.map((k, i) => {
          const a = angle(i);
          const x = cx + (R + 14) * Math.cos(a);
          const y = cy + (R + 14) * Math.sin(a);
          const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
          const [l1, l2] = SHORT[k];
          return (
            <text key={k} x={x} y={y} textAnchor={anchor} fontSize="12" fontWeight="600" fill="var(--ink-2)">
              <tspan x={x} dy={Math.sin(a) < -0.9 ? (l2 ? "-1.3em" : "-0.3em") : Math.sin(a) > 0.5 ? "0.9em" : l2 ? "-0.2em" : "0.35em"}>
                {l1}
              </tspan>
              {l2 && (
                <tspan x={x} dy="1.2em">
                  {l2}
                </tspan>
              )}
            </text>
          );
        })}
      </svg>
      <figcaption className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden>
            <line x1="1" x2="21" y1="4" y2="4" stroke="var(--primary)" strokeWidth="2" />
          </svg>
          Placed score
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden>
            <line x1="1" x2="21" y1="4" y2="4" stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 3" />
          </svg>
          Your self-rating
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden>
            <line x1="1" x2="21" y1="4" y2="4" stroke="var(--accent)" strokeWidth="1.25" strokeDasharray="2 2" />
          </svg>
          Bar {LEVEL_BAR}
        </span>
      </figcaption>
    </figure>
  );
}

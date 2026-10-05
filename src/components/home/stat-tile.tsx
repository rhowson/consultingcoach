/** Readiness ring used on Home. */
export function ProgressRing({ percent, label, size = 88, stroke = 8 }: { percent: number; label: string; size?: number; stroke?: number }) {
  const p = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="relative flex-none"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-hover" />
        {p > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - p / 100)}
            className="stroke-primary"
          />
        )}
      </svg>
      <span aria-hidden className="tabular absolute inset-0 flex items-center justify-center font-display text-xl font-semibold tracking-tight">
        {p}%
      </span>
    </div>
  );
}

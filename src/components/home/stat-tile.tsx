import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { IconChip, type IconChipTone } from "@/components/ui/icons";

/** KPI tile: label + icon chip on top, a large value with a caption, and an optional small chart on the right. */
export function StatTile({
  Icon,
  tone = "primary",
  label,
  value,
  unit,
  caption,
  chart,
}: {
  Icon: LucideIcon;
  tone?: IconChipTone;
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  caption: ReactNode;
  chart?: ReactNode;
}) {
  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted">{label}</span>
        <IconChip Icon={Icon} tone={tone} size="sm" />
      </div>
      <div className="mt-auto flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="tabular flex items-baseline gap-1 font-display leading-none font-semibold tracking-tight">
            <span className="text-[32px]">{value}</span>
            {unit && <span className="text-base font-medium text-muted">{unit}</span>}
          </span>
          <span className="text-[13px] leading-snug text-muted">{caption}</span>
        </div>
        {chart}
      </div>
    </li>
  );
}

/** Small circular progress ring, exposed as a progressbar. */
export function ProgressRing({ percent, label, size = 56, stroke = 6 }: { percent: number; label: string; size?: number; stroke?: number }) {
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
      className="flex-none"
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
    </div>
  );
}

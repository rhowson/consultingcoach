import { ArrowRight, CircleAlert, CircleCheck, CircleMinus } from "lucide-react";
import { COMPETENCY_LABELS, LEVEL_LABELS, type Competency, type Level, type Verdict } from "@/lib/competency";
import { CompetencyIcon } from "./icons";

/** Shared pill geometry so every chip and badge lines up at the same height. */
const PILL = "inline-flex h-6 flex-none items-center gap-1.5 rounded-full px-2.5 text-xs leading-none font-semibold whitespace-nowrap";

/**
 * Solid fills. Manager and Director use colours that lighten in dark mode, so they take `on-primary`
 * (white in light, near-black in dark); Director uses the darker accent ink to keep white text legible.
 */
const LEVEL_SOLID: Record<Level, string> = {
  analyst: "bg-level-analyst text-white",
  consultant: "bg-level-consultant text-white",
  manager: "bg-level-manager text-on-primary",
  director: "bg-accent-ink text-on-primary",
};
/** Soft tints: ink text for contrast, the level colour carried by the tint and the dot. */
const LEVEL_TINT: Record<Level, { pill: string; dot: string }> = {
  analyst: { pill: "bg-level-analyst/12", dot: "bg-level-analyst" },
  consultant: { pill: "bg-level-consultant/12", dot: "bg-level-consultant" },
  manager: { pill: "bg-level-manager/12", dot: "bg-level-manager" },
  director: { pill: "bg-level-director/15", dot: "bg-level-director" },
};

/** Level pill. `solid` for the user's own level, a soft tint with a colour dot for targets. */
export function LevelBadge({ level, solid = false }: { level: Level; solid?: boolean }) {
  if (solid) return <span className={`${PILL} ${LEVEL_SOLID[level]}`}>{LEVEL_LABELS[level]}</span>;
  const t = LEVEL_TINT[level];
  return (
    <span className={`${PILL} pl-2 text-ink ${t.pill}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {LEVEL_LABELS[level]}
    </span>
  );
}

/** "Consultant → Manager 52%" pill used in the top bar. */
export function ReadinessPill({ from, to, percent, compact = false }: { from: Level; to: Level; percent: number; compact?: boolean }) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-full border border-border bg-surface pr-3 pl-1 shadow-sm">
      <LevelBadge level={from} solid />
      <ArrowRight size={14} className="text-faint" aria-hidden />
      {!compact && <span className="text-[13px] font-semibold text-primary">{LEVEL_LABELS[to]}</span>}
      <span className="tabular text-[13px] font-semibold text-ink">{percent}%</span>
    </div>
  );
}

export function CompetencyChip({ competency }: { competency: Competency }) {
  return (
    <span className={`${PILL} self-start bg-primary-tint pl-2 font-medium text-ink-2`}>
      <CompetencyIcon competency={competency} size={13} strokeWidth={2.25} className="text-primary" />
      {COMPETENCY_LABELS[competency]}
    </span>
  );
}

const VERDICT = {
  meets: { label: "Meets bar", cls: "bg-success-tint text-success", Icon: CircleCheck },
  approaching: { label: "Approaching", cls: "bg-warning-tint text-warning-ink", Icon: CircleMinus },
  below: { label: "Below bar", cls: "bg-danger-tint text-danger", Icon: CircleAlert },
} as const;

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const v = VERDICT[verdict];
  return (
    <span className={`${PILL} gap-1 pl-1.5 ${v.cls}`}>
      <v.Icon size={14} strokeWidth={2.25} aria-hidden />
      {v.label}
    </span>
  );
}

export function DifficultyDots({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" role="img" aria-label={`Difficulty ${value} of ${max}`}>
      <span aria-hidden>Difficulty</span>
      <span aria-hidden className="flex gap-[3px]">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`h-[7px] w-[7px] rounded-full ${i < value ? "bg-primary" : "bg-border-strong"}`} />
        ))}
      </span>
    </span>
  );
}

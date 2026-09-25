import { ArrowRight, CircleAlert, CircleCheck, CircleMinus } from "lucide-react";
import { COMPETENCY_LABELS, LEVEL_LABELS, type Competency, type Level, type Verdict } from "@/lib/competency";
import { CompetencyIcon } from "./icons";

const LEVEL_BG: Record<Level, string> = {
  analyst: "bg-level-analyst",
  consultant: "bg-level-consultant",
  manager: "bg-level-manager",
  director: "bg-level-director",
};
const LEVEL_TEXT: Record<Level, string> = {
  analyst: "text-level-analyst border-level-analyst",
  consultant: "text-level-consultant border-level-consultant",
  manager: "text-level-manager border-level-manager",
  director: "text-accent-ink border-level-director",
};

/** Level pill. `solid` for the user's own level, outline for targets. */
export function LevelBadge({ level, solid = false }: { level: Level; solid?: boolean }) {
  return solid ? (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${LEVEL_BG[level]}`}>{LEVEL_LABELS[level]}</span>
  ) : (
    <span className={`inline-flex rounded-full border px-2.5 py-px text-xs font-semibold ${LEVEL_TEXT[level]}`}>{LEVEL_LABELS[level]}</span>
  );
}

/** "Consultant → Manager 52%" pill used in the top bar. */
export function ReadinessPill({ from, to, percent, compact = false }: { from: Level; to: Level; percent: number; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface py-[3px] pr-3 pl-[3px]">
      <LevelBadge level={from} solid />
      <ArrowRight size={14} className="text-muted" aria-hidden />
      {!compact && <span className="text-[13px] font-semibold text-primary">{LEVEL_LABELS[to]}</span>}
      <span className="tabular text-[13px] font-semibold">{percent}%</span>
    </div>
  );
}

export function CompetencyChip({ competency }: { competency: Competency }) {
  return (
    <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-hover px-2.5 py-0.5 pl-2 text-xs font-medium text-ink-2">
      <CompetencyIcon competency={competency} size={14} />
      {COMPETENCY_LABELS[competency]}
    </span>
  );
}

const VERDICT = {
  meets: { label: "Meets bar", cls: "text-success bg-success-tint", Icon: CircleCheck },
  approaching: { label: "Approaching", cls: "text-warning-ink bg-warning-tint", Icon: CircleMinus },
  below: { label: "Below bar", cls: "text-danger bg-danger-tint", Icon: CircleAlert },
} as const;

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const v = VERDICT[verdict];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full py-px pr-2 pl-1.5 text-xs font-semibold ${v.cls}`}>
      <v.Icon size={13} strokeWidth={2} aria-hidden />
      {v.label}
    </span>
  );
}

export function DifficultyDots({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <span className="flex items-center gap-1.5" aria-label={`Difficulty ${value} of ${max}`}>
      Difficulty
      <span className="flex gap-[3px]">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`h-[7px] w-[7px] rounded-full ${i < value ? "bg-ink" : "bg-border-strong"}`} />
        ))}
      </span>
    </span>
  );
}

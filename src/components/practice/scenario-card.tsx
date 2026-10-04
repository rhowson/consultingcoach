import Link from "next/link";
import { Clock, Lock, MessagesSquare, PanelsTopLeft, Presentation, Trophy } from "lucide-react";
import { PRACTICE_AREA_LABELS } from "@/lib/practice-areas";
import { CompetencyChip, DifficultyDots, LevelBadge } from "@/components/ui/badges";
import { PersonaAvatar } from "@/components/ui/avatar";
import { IconChip } from "@/components/ui/icons";
import type { HubScenario } from "./practice-hub";

const KIND = {
  simulation: { label: "Client Simulator", Icon: MessagesSquare, tone: "primary" },
  storyboard: { label: "Storyboard case", Icon: PanelsTopLeft, tone: "accent" },
  rehearsal: { label: "SteerCo rehearsal", Icon: Presentation, tone: "success" },
} as const;

const CARD =
  "group relative flex w-full flex-col gap-4 rounded-xl border border-border bg-surface p-5 text-left text-ink no-underline shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out";
const LIFT = "cursor-pointer hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:shadow-md";

/** ScenarioCard from the design system: kind, practice area, title, persona, competencies, difficulty, level, duration, best score. */
export function ScenarioCard({ scenario, onOpen }: { scenario: HubScenario; onOpen?: () => void }) {
  const s = scenario;
  const kind = KIND[s.kind];
  const dim = s.isPro ? "opacity-60" : "";

  const body = (
    <>
      <span className="flex items-center gap-3">
        <IconChip Icon={kind.Icon} tone={kind.tone} size="sm" className={dim} />
        <span className={`flex min-w-0 flex-1 flex-col leading-tight ${dim}`}>
          <span className="text-xs font-semibold text-muted">{kind.label}</span>
          {s.practiceArea && <span className="truncate text-xs font-semibold text-primary">{PRACTICE_AREA_LABELS[s.practiceArea]}</span>}
        </span>
        {s.isPro && (
          <span className="inline-flex h-6 flex-none items-center gap-1 rounded-full bg-accent-tint px-2.5 text-xs font-semibold text-accent-ink">
            <Lock size={12} aria-hidden />
            Pro
            <span className="sr-only">: unlock with Pro</span>
          </span>
        )}
      </span>

      <span className={`flex flex-col gap-2.5 ${dim}`}>
        <span className="font-display text-lg leading-snug font-semibold tracking-tight">{s.title}</span>
        {s.persona && (
          <span className="flex items-center gap-2.5">
            <PersonaAvatar id={s.persona.id} name={s.persona.name} size={28} />
            <span className="min-w-0 truncate text-[13px] text-muted">
              <span className="font-semibold text-ink-2">{s.persona.name}</span>, {s.persona.title}
            </span>
          </span>
        )}
      </span>

      <span className={`flex flex-wrap gap-1.5 ${dim}`}>
        {s.competencies.map((c) => (
          <CompetencyChip key={c} competency={c} />
        ))}
      </span>

      <span className={`mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-divider pt-4 text-[13px] text-muted ${dim}`}>
        <LevelBadge level={s.targetLevel} />
        <DifficultyDots value={s.difficulty} />
        <span className="flex items-center gap-1">
          <Clock size={14} aria-hidden />
          {s.durationMin} min
        </span>
        <span className="tabular ml-auto flex items-center gap-1">
          <Trophy size={14} aria-hidden className={s.bestScore != null ? "text-accent" : ""} />
          Best <b className="font-semibold text-ink">{s.bestScore != null ? s.bestScore.toFixed(1) : "—"}</b>
        </span>
      </span>
    </>
  );

  if (s.kind === "storyboard" && !s.isPro) {
    return (
      <Link href={`/studio/new?case=${s.id}`} className={`${CARD} ${LIFT}`}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup={onOpen ? "dialog" : undefined}
      aria-disabled={onOpen ? undefined : true}
      title={s.isPro ? "Unlock with Pro" : undefined}
      className={`${CARD} ${s.isPro ? `bg-subtle shadow-none ${onOpen ? "cursor-pointer hover:border-border-strong" : ""}` : onOpen ? LIFT : ""}`}
    >
      {body}
    </button>
  );
}

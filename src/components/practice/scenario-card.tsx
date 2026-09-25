import Link from "next/link";
import { Clock, Lock, Presentation } from "lucide-react";
import { CompetencyChip, DifficultyDots, LevelBadge } from "@/components/ui/badges";
import { PersonaAvatar } from "@/components/ui/avatar";
import type { HubScenario } from "./practice-hub";

const CARD =
  "relative flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-5 text-left text-ink no-underline transition-colors duration-150 hover:border-border-strong";

/** ScenarioCard from the design system: persona, title, competencies, difficulty, level, duration, best score. */
export function ScenarioCard({ scenario, onOpen }: { scenario: HubScenario; onOpen?: () => void }) {
  const s = scenario;
  const subtitle = s.persona
    ? `${s.persona.name}, ${s.persona.title}`
    : s.kind === "storyboard"
      ? "Storyboard case"
      : "SteerCo rehearsal";

  const body = (
    <>
      <span className={`flex items-center gap-3 ${s.isPro ? "opacity-60" : ""}`}>
        {s.persona ? (
          <PersonaAvatar id={s.persona.id} name={s.persona.name} />
        ) : (
          <span aria-hidden className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary-tint text-primary">
            <Presentation size={20} />
          </span>
        )}
        <span className={`flex min-w-0 flex-1 flex-col leading-snug ${s.isPro ? "pr-14" : ""}`}>
          <span className="font-serif text-lg font-semibold">{s.title}</span>
          <span className="truncate text-[13px] text-muted">{subtitle}</span>
        </span>
      </span>
      {s.isPro && (
        <span className="absolute top-5 right-5 flex items-center gap-1 rounded-full bg-accent-tint px-2.5 py-0.5 text-xs font-semibold text-ink">
          <Lock size={13} aria-hidden />
          Pro
          <span className="sr-only">: unlock with Pro</span>
        </span>
      )}
      <span className={`flex flex-wrap gap-1.5 ${s.isPro ? "opacity-60" : ""}`}>
        {s.competencies.map((c) => (
          <CompetencyChip key={c} competency={c} />
        ))}
      </span>
      <span className={`mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-divider pt-3 text-[13px] text-muted ${s.isPro ? "opacity-60" : ""}`}>
        <DifficultyDots value={s.difficulty} />
        <LevelBadge level={s.targetLevel} />
        <span className="flex items-center gap-1">
          <Clock size={14} aria-hidden />
          {s.durationMin} min
        </span>
        <span className="tabular ml-auto">
          Best <b className="font-semibold text-ink">{s.bestScore != null ? s.bestScore.toFixed(1) : "—"}</b>
        </span>
      </span>
    </>
  );

  if (s.kind === "storyboard" && !s.isPro) {
    return (
      <Link href={`/studio/new?case=${s.id}`} className={CARD}>
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
      className={`${CARD} cursor-pointer ${s.isPro ? "bg-subtle" : ""}`}
    >
      {body}
    </button>
  );
}

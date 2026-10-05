import Link from "next/link";
import { Clock, Lock, MessagesSquare, PanelsTopLeft, Trophy } from "lucide-react";
import { PRACTICE_AREA_SHORT } from "@/lib/practice-areas";
import { LevelBadge } from "@/components/ui/badges";
import { PersonaAvatar } from "@/components/ui/avatar";
import type { HubScenario } from "./practice-hub";

const KIND = {
  simulation: { label: "Conversation", Icon: MessagesSquare },
  storyboard: { label: "Storyline", Icon: PanelsTopLeft },
  rehearsal: { label: "Rehearsal", Icon: PanelsTopLeft },
} as const;

const CARD =
  "group relative flex w-full flex-col gap-3 rounded-xl border border-border bg-surface p-5 text-left text-ink no-underline shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out";
const LIFT = "cursor-pointer hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:shadow-md";

/** Scenario list card: kind and area, title, summary, persona, then level, duration and best score. */
export function ScenarioCard({ scenario, onOpen }: { scenario: HubScenario; onOpen?: () => void }) {
  const s = scenario;
  const kind = KIND[s.kind];
  const dim = s.isPro ? "opacity-60" : "";

  const body = (
    <>
      <span className={`flex items-center gap-1.5 text-xs font-semibold text-muted ${dim}`}>
        <kind.Icon size={14} className="flex-none text-primary" aria-hidden />
        <span className="sr-only">{kind.label} · </span>
        <span className="min-w-0 flex-1 truncate">{s.practiceArea ? PRACTICE_AREA_SHORT[s.practiceArea] : kind.label}</span>
        {s.isPro && (
          <span className="inline-flex h-6 flex-none items-center gap-1 rounded-full bg-accent-tint px-2.5 text-xs font-semibold text-accent-ink">
            <Lock size={12} aria-hidden />
            Pro
            <span className="sr-only">: unlock with Pro</span>
          </span>
        )}
      </span>

      <span className={`flex flex-col gap-1.5 ${dim}`}>
        <span className="font-display text-lg leading-snug font-semibold tracking-tight">{s.title}</span>
        <span className="line-clamp-2 text-sm text-ink-2">{s.summary}</span>
      </span>

      {s.persona && (
        <span className={`flex items-center gap-2.5 ${dim}`}>
          <PersonaAvatar id={s.persona.id} name={s.persona.name} size={28} />
          <span className="min-w-0 truncate text-[13px] text-muted">
            <span className="font-semibold text-ink-2">{s.persona.name}</span>, {s.persona.title}
          </span>
        </span>
      )}

      <span className={`mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-divider pt-3.5 text-[13px] text-muted ${dim}`}>
        <LevelBadge level={s.targetLevel} />
        <span className="flex items-center gap-1">
          <Clock size={14} aria-hidden />
          {s.durationMin} min
        </span>
        {s.bestScore != null && (
          <span className="tabular ml-auto flex items-center gap-1">
            <Trophy size={14} aria-hidden className="text-accent" />
            Best <b className="font-semibold text-ink">{s.bestScore.toFixed(1)}</b>
          </span>
        )}
      </span>
    </>
  );

  if (s.kind === "storyboard" && !s.isPro) {
    return (
      <Link href={`/studio/new?case=${encodeURIComponent(s.id)}`} className={`${CARD} ${LIFT}`}>
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

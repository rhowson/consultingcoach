"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Lock, MessagesSquare, Play, Target, X } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import type { Level } from "@/lib/competency";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/card";
import { LevelBadge } from "@/components/ui/badges";
import { PersonaAvatar } from "@/components/ui/avatar";
import { IconChip } from "@/components/ui/icons";
import type { HubScenario } from "./practice-hub";

type Detail = Awaited<ReturnType<typeof api.scenarios.get>>;

/** Right-side briefing drawer for a conversation. Native <dialog> gives focus trapping and Esc to close. */
export function BriefingDrawer({ scenario, targetLevel, onClose }: { scenario: HubScenario; targetLevel: Level; onClose: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    // No cleanup close(): its async "close" event would re-fire onClose after a StrictMode remount.
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    let live = true;
    api.scenarios
      .get(scenario.id)
      .then((d) => live && setDetail(d))
      .catch((e: unknown) => live && setLoadError(e instanceof ApiError ? e.message : "Couldn't load the briefing."));
    return () => {
      live = false;
    };
  }, [scenario.id]);

  async function begin() {
    setStarting(true);
    setStartError(null);
    try {
      const view = await api.simulations.start({ scenarioId: scenario.id });
      router.push(`/practice/sim/${view.attempt.id}`);
    } catch (e) {
      setStartError(e instanceof ApiError ? e.message : "Couldn't start the session. Try again.");
      setStarting(false);
    }
  }

  const persona = detail?.persona ?? scenario.persona;
  const briefing = detail?.scenario.briefing;
  // What good looks like at the user's target level, falling back to the scenario's own level.
  const goodLevel: Level | null = briefing ? (briefing.whatGoodLooksLike[targetLevel] ? targetLevel : briefing.whatGoodLooksLike[scenario.targetLevel] ? scenario.targetLevel : null) : null;

  return (
    <dialog
      ref={ref}
      aria-labelledby="brief-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 flex h-dvh max-h-dvh w-full max-w-[520px] flex-col overflow-hidden border-0 bg-surface p-0 text-ink shadow-lg backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:flex sm:rounded-l-2xl [&:not([open])]:hidden"
    >
      <div className="sky flex items-center gap-3 px-5 pt-5 pb-6">
        <div className="glass flex min-w-0 flex-1 items-center gap-3 rounded-lg p-3 shadow-sm">
          {persona ? (
            <>
              <PersonaAvatar id={persona.id} name={persona.name} size={44} />
              <div className="flex min-w-0 flex-1 flex-col leading-snug">
                <span className="eyebrow text-[11px]">Your client</span>
                <span className="text-sm font-semibold">{persona.name}</span>
                <span className="truncate text-[13px] text-ink-2">
                  {persona.title}
                  {persona.company ? `, ${persona.company}` : ""}
                </span>
              </div>
            </>
          ) : (
            <>
              <IconChip Icon={MessagesSquare} />
              <Eyebrow className="flex-1">Briefing</Eyebrow>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close briefing"
          className="glass flex h-10 w-10 flex-none cursor-pointer items-center justify-center self-start rounded-full text-ink shadow-sm transition-colors hover:bg-surface"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
        <div className="flex flex-col gap-2.5">
          <h2 id="brief-title" className="m-0 font-display text-[26px] leading-tight font-semibold tracking-tight">
            {scenario.title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
            <LevelBadge level={scenario.targetLevel} />
            <span className="flex items-center gap-1.5">
              <Clock size={16} aria-hidden />
              {scenario.durationMin} min
            </span>
          </div>
        </div>

        {loadError && (
          <p role="alert" className="m-0 rounded-lg bg-danger-tint px-4 py-3 text-sm text-danger">
            {loadError}
          </p>
        )}

        {!detail && !loadError && (
          <div aria-busy="true" aria-label="Loading briefing" className="flex flex-col gap-3">
            {[100, 90, 70, 95, 60].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded-md bg-hover" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {briefing && (
          <div className="flex flex-col gap-5 text-sm leading-relaxed">
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Situation</span>
              <span className="text-ink-2">{briefing.situation}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Your role</span>
              <span className="text-ink-2">{briefing.yourRole}</span>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-primary/15 bg-subtle px-4 py-3.5">
              <Target size={18} className="mt-0.5 flex-none text-primary" aria-hidden />
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">Objective</span>
                <span>{briefing.objective}</span>
              </span>
            </div>
            {goodLevel && (
              <div className="flex flex-col gap-2 border-t border-border pt-5">
                <span className="flex flex-wrap items-center gap-2 font-semibold">
                  What good looks like
                  <LevelBadge level={goodLevel} solid={goodLevel === targetLevel} />
                </span>
                <span className="text-ink-2">{briefing.whatGoodLooksLike[goodLevel]}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border bg-surface px-6 py-4">
        {startError && (
          <p role="alert" className="m-0 text-sm text-danger">
            {startError}
          </p>
        )}
        {scenario.isPro ? (
          <Button size="lg" disabled className="w-full">
            <Lock size={18} aria-hidden />
            Unlock with Pro
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={begin} disabled={starting}>
            <Play size={18} aria-hidden />
            {starting ? "Starting…" : "Start conversation"}
          </Button>
        )}
      </div>
    </dialog>
  );
}

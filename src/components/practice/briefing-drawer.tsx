"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Lock, MessagesSquare, Play, Target, X } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { COMPETENCY_LABELS, LEVELS, LEVEL_LABELS, type Level } from "@/lib/competency";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/card";
import { CompetencyChip, DifficultyDots, LevelBadge } from "@/components/ui/badges";
import { PersonaAvatar } from "@/components/ui/avatar";
import type { HubScenario } from "./practice-hub";

type Detail = Awaited<ReturnType<typeof api.scenarios.get>>;

/** Right-side briefing drawer for a simulation scenario. Native <dialog> gives focus trapping and Esc to close. */
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
  const good = briefing ? LEVELS.filter((l) => briefing.whatGoodLooksLike[l]) : [];

  return (
    <dialog
      ref={ref}
      aria-labelledby="brief-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 flex h-dvh max-h-dvh w-full max-w-[520px] flex-col border-0 border-l border-border bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/40 open:flex [&:not([open])]:hidden"
    >
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        {persona ? (
          <>
            <PersonaAvatar id={persona.id} name={persona.name} />
            <div className="flex min-w-0 flex-1 flex-col leading-snug">
              <span className="text-sm font-semibold">{persona.name}</span>
              <span className="truncate text-[13px] text-muted">
                {persona.title}, {persona.company}
              </span>
            </div>
          </>
        ) : (
          <Eyebrow className="flex-1">Briefing</Eyebrow>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close briefing"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-transparent text-ink-2 hover:bg-hover"
        >
          <X size={20} aria-hidden />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
        <div className="flex flex-col gap-3">
          <Eyebrow>Client Simulator</Eyebrow>
          <h2 id="brief-title" className="m-0 font-serif text-[26px] leading-tight font-semibold tracking-tight">
            {scenario.title}
          </h2>
          <p className="m-0 text-[15px] text-ink-2">{scenario.summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {scenario.competencies.map((c) => (
              <CompetencyChip key={c} competency={c} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
              <Clock size={16} aria-hidden />
              {scenario.durationMin} min
            </span>
            <DifficultyDots value={scenario.difficulty} />
            <LevelBadge level={scenario.targetLevel} />
            {detail && (
              <span className="tabular flex items-center gap-1.5">
                <MessagesSquare size={16} aria-hidden />
                About {detail.scenario.maxTurns} turns
              </span>
            )}
          </div>
        </div>

        {loadError && (
          <p role="alert" className="m-0 rounded-md bg-danger-tint px-3.5 py-3 text-sm text-danger">
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

        {briefing && detail && (
          <>
            <div className="flex flex-col gap-4 text-sm leading-relaxed">
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Situation</span>
                <span className="text-ink-2">{briefing.situation}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Your role</span>
                <span className="text-ink-2">{briefing.yourRole}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-md bg-subtle px-3.5 py-3">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Target size={16} className="text-primary" aria-hidden />
                  Objective
                </span>
                <span>{briefing.objective}</span>
              </div>
            </div>

            {detail.scenario.objectives.length > 0 && (
              <section aria-labelledby="brief-obj" className="flex flex-col gap-2.5 border-t border-border pt-5">
                <Eyebrow id="brief-obj">Objectives</Eyebrow>
                <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
                  {detail.scenario.objectives.map((o) => (
                    <li key={o.id} className="flex items-start gap-2.5">
                      <span aria-hidden className="mt-0.5 h-4 w-4 flex-none rounded-full border-[1.5px] border-border-strong" />
                      {o.label}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {good.length > 0 && (
              <section aria-labelledby="brief-good" className="flex flex-col gap-3 border-t border-border pt-5">
                <Eyebrow id="brief-good">What good looks like</Eyebrow>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {good.map((l) => {
                    const mine = l === targetLevel;
                    return (
                      <li
                        key={l}
                        className={`flex flex-col gap-1.5 rounded-md border px-3.5 py-3 text-sm ${mine ? "border-accent bg-accent-tint/40" : "border-border"}`}
                      >
                        <span className="flex items-center gap-2">
                          <LevelBadge level={l} solid={mine} />
                          {mine && <span className="text-xs font-semibold text-accent-ink">Your target</span>}
                        </span>
                        <span className="text-ink-2">{briefing.whatGoodLooksLike[l]}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {detail.rubric && detail.rubric.criteria.length > 0 && (
              <section aria-labelledby="brief-rubric" className="flex flex-col gap-3 border-t border-border pt-5">
                <Eyebrow id="brief-rubric">How you&apos;ll be scored</Eyebrow>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {detail.rubric.criteria.map((c) => (
                    <li key={c.id} className="flex items-start gap-2.5 text-sm">
                      <Check size={16} className="mt-0.5 flex-none text-success" aria-hidden />
                      <span className="flex flex-col gap-0.5">
                        <span className="font-semibold">
                          {c.label} <span className="font-normal text-muted">· {COMPETENCY_LABELS[c.competency]}</span>
                        </span>
                        <span className="text-ink-2">{c.description}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="m-0 text-xs text-muted">Each criterion is scored 1–5. The {LEVEL_LABELS[targetLevel]} bar is 3.5.</p>
              </section>
            )}
          </>
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
            {starting ? "Starting…" : "Begin session"}
          </Button>
        )}
        <p className="m-0 text-center text-xs text-muted">The coach stays silent until you end the conversation.</p>
      </div>
    </dialog>
  );
}

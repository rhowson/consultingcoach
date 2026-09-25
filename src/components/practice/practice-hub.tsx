"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Presentation, SearchX } from "lucide-react";
import type { Persona, Scenario } from "@/lib/client/api";
import { COMPETENCIES, COMPETENCY_LABELS, LEVELS, LEVEL_LABELS, type Competency, type Level } from "@/lib/competency";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ScenarioCard } from "./scenario-card";
import { BriefingDrawer } from "./briefing-drawer";

export type HubScenario = Scenario & { persona: Persona | null; bestScore: number | null };

const TABS = [
  { id: "simulation", label: "Client Simulator" },
  { id: "storyboard", label: "Storyboard cases" },
  { id: "rehearsal", label: "SteerCo Rehearsal" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const SELECT =
  "h-9 rounded-md border border-border bg-surface pr-8 pl-3 text-sm text-ink hover:bg-hover focus-visible:outline-2 focus-visible:outline-primary";

export function PracticeHub({
  scenarios,
  targetLevel,
  initialStart,
}: {
  scenarios: HubScenario[];
  targetLevel: Level;
  initialStart: string | null;
}) {
  const startScenario = initialStart ? scenarios.find((s) => s.id === initialStart) : undefined;
  const [tab, setTab] = useState<Tab>(startScenario?.kind ?? "simulation");
  const [competency, setCompetency] = useState<Competency | "">("");
  const [level, setLevel] = useState<Level | "">("");
  const [openId, setOpenId] = useState<string | null>(startScenario?.kind === "simulation" ? startScenario.id : null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { simulation: 0, storyboard: 0, rehearsal: 0 };
    for (const s of scenarios) c[s.kind]++;
    return c;
  }, [scenarios]);

  const visible = scenarios
    .filter((s) => s.kind === tab)
    .filter((s) => !competency || s.competencies.includes(competency))
    .filter((s) => !level || s.targetLevel === level)
    .sort((a, b) => Number(a.isPro) - Number(b.isPro));

  const open = openId ? scenarios.find((s) => s.id === openId) : undefined;

  function setDrawer(id: string | null) {
    setOpenId(id);
    try {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set("start", id);
      else url.searchParams.delete("start");
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // URL sync is a nicety only.
    }
  }

  function onTabKey(e: KeyboardEvent, i: number) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  const filtered = Boolean(competency || level);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border md:flex-row md:items-end md:justify-between">
        <div role="tablist" aria-label="Practice type" className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((t, i) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={active}
                aria-controls={`panel-${t.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={`flex flex-none items-center gap-2 border-b-2 bg-transparent px-0 pt-1 pb-3 text-sm whitespace-nowrap ${
                  active ? "border-primary font-semibold text-primary" : "border-transparent font-medium text-muted hover:text-ink"
                }`}
              >
                {t.label}
                {t.id !== "rehearsal" && (
                  <span className={`tabular rounded-full px-1.5 text-xs ${active ? "bg-primary-tint" : "bg-hover"}`}>{counts[t.id]}</span>
                )}
              </button>
            );
          })}
        </div>
        {tab !== "rehearsal" && (
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <label className="sr-only" htmlFor="filter-competency">
              Competency
            </label>
            <select id="filter-competency" value={competency} onChange={(e) => setCompetency(e.target.value as Competency | "")} className={SELECT}>
              <option value="">All competencies</option>
              {COMPETENCIES.map((c) => (
                <option key={c} value={c}>
                  {COMPETENCY_LABELS[c]}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="filter-level">
              Level
            </label>
            <select id="filter-level" value={level} onChange={(e) => setLevel(e.target.value as Level | "")} className={SELECT}>
              <option value="">All levels</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "rehearsal" ? (
          <Card className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:p-8">
            <div aria-hidden className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-primary-tint text-primary">
              <Presentation size={24} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <CardTitle>Rehearse your SteerCo</CardTitle>
              <p className="m-0 max-w-[620px] text-sm text-ink-2">
                Rehearsal starts from a storyboard you&apos;ve submitted. Build or pick one in Storyboard Studio, then present it to an AI steering
                committee that interrupts, challenges and asks for the so-what.
              </p>
            </div>
            <ButtonLink href="/studio" size="lg">
              Go to Storyboard Studio
              <ArrowRight size={16} aria-hidden />
            </ButtonLink>
          </Card>
        ) : visible.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <SearchX size={28} className="text-faint" aria-hidden />
            <p className="m-0 text-sm text-muted">
              {filtered ? "No scenarios match these filters." : "No scenarios here yet. New ones are on the way."}
            </p>
            {filtered && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCompetency("");
                  setLevel("");
                }}
              >
                Clear filters
              </Button>
            )}
          </Card>
        ) : (
          <>
            <p className="sr-only" aria-live="polite">
              {visible.length} {visible.length === 1 ? "scenario" : "scenarios"}
            </p>
            <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((s) => (
                <li key={s.id} className="flex">
                  <ScenarioCard scenario={s} onOpen={s.kind === "simulation" ? () => setDrawer(s.id) : undefined} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {open && <BriefingDrawer key={open.id} scenario={open} targetLevel={targetLevel} onClose={() => setDrawer(null)} />}
    </div>
  );
}

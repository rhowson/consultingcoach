"use client";

import { useMemo, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { ArrowRight, ChevronDown, MessagesSquare, PanelsTopLeft, Presentation, SearchX, X } from "lucide-react";
import type { Persona, Scenario } from "@/lib/client/api";
import { COMPETENCIES, COMPETENCY_LABELS, LEVELS, LEVEL_LABELS, type Competency, type Level } from "@/lib/competency";
import { PRACTICE_AREAS, PRACTICE_AREA_SHORT, type PracticeArea } from "@/lib/practice-areas";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icons";
import { ScenarioCard } from "./scenario-card";
import { BriefingDrawer } from "./briefing-drawer";

export type HubScenario = Scenario & { persona: Persona | null; bestScore: number | null };

const TABS = [
  { id: "simulation", label: "Client Simulator", Icon: MessagesSquare },
  { id: "storyboard", label: "Storyboard cases", Icon: PanelsTopLeft },
  { id: "rehearsal", label: "SteerCo Rehearsal", Icon: Presentation },
] as const;
type Tab = (typeof TABS)[number]["id"];

const SELECT =
  "h-10 w-full cursor-pointer appearance-none rounded-full border pr-9 pl-4 text-sm shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary";
const SELECT_IDLE = "border-border bg-surface text-ink hover:bg-hover";
const SELECT_ACTIVE = "border-primary/40 bg-primary-tint font-medium text-primary";

/** Native select styled as a pill, with its own chevron. */
function PillSelect({ id, label, active, children, ...props }: ComponentProps<"select"> & { id: string; label: string; active: boolean }) {
  return (
    <span className="relative inline-flex min-w-0 flex-1 sm:flex-none">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select id={id} className={`${SELECT} ${active ? SELECT_ACTIVE : SELECT_IDLE}`} {...props}>
        {children}
      </select>
      <ChevronDown size={16} aria-hidden className={`pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 ${active ? "text-primary" : "text-muted"}`} />
    </span>
  );
}

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
  const [area, setArea] = useState<PracticeArea | "">("");
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
    .filter((s) => !area || s.practiceArea === area)
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
    const next =
      e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i - 1 + TABS.length) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  const filtered = Boolean(competency || level || area);
  function clearFilters() {
    setCompetency("");
    setLevel("");
    setArea("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div
          role="tablist"
          aria-label="Practice type"
          className="inline-flex max-w-full flex-none gap-1 self-start overflow-x-auto rounded-full border border-border bg-surface p-1 shadow-sm"
        >
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
                className={`inline-flex h-9 flex-none cursor-pointer items-center gap-2 rounded-full border-0 px-4 text-sm whitespace-nowrap transition-colors ${
                  active ? "bg-primary font-semibold text-on-primary shadow-sm" : "bg-transparent font-medium text-ink-2 hover:bg-hover hover:text-ink"
                }`}
              >
                <t.Icon size={16} aria-hidden />
                {t.label}
                {t.id !== "rehearsal" && (
                  <span
                    className={`tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                      active ? "bg-on-primary/20 text-on-primary" : "bg-hover text-muted"
                    }`}
                  >
                    {counts[t.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {tab !== "rehearsal" && (
          <div className="flex flex-wrap items-center gap-2">
            <PillSelect id="filter-area" label="Practice area" active={Boolean(area)} value={area} onChange={(e) => setArea(e.target.value as PracticeArea | "")}>
              <option value="">All practice areas</option>
              {PRACTICE_AREAS.map((a) => (
                <option key={a} value={a}>
                  {PRACTICE_AREA_SHORT[a]}
                </option>
              ))}
            </PillSelect>
            <PillSelect
              id="filter-competency"
              label="Competency"
              active={Boolean(competency)}
              value={competency}
              onChange={(e) => setCompetency(e.target.value as Competency | "")}
            >
              <option value="">All competencies</option>
              {COMPETENCIES.map((c) => (
                <option key={c} value={c}>
                  {COMPETENCY_LABELS[c]}
                </option>
              ))}
            </PillSelect>
            <PillSelect id="filter-level" label="Level" active={Boolean(level)} value={level} onChange={(e) => setLevel(e.target.value as Level | "")}>
              <option value="">All levels</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABELS[l]}
                </option>
              ))}
            </PillSelect>
            {filtered && (
              <Button variant="ghost" size="md" onClick={clearFilters}>
                <X size={16} aria-hidden />
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "rehearsal" ? (
          <Card className="flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:p-8">
            <IconChip Icon={Presentation} tone="success" />
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
          <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <IconChip Icon={SearchX} tone="neutral" />
            <p className="m-0 text-sm text-muted">
              {filtered ? "No scenarios match these filters." : "No scenarios here yet. New ones are on the way."}
            </p>
            {filtered && (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </Card>
        ) : (
          <>
            <p className="sr-only" aria-live="polite">
              {visible.length} {visible.length === 1 ? "scenario" : "scenarios"}
            </p>
            <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 xl:grid-cols-3">
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

"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { MessagesSquare, PanelsTopLeft, SearchX } from "lucide-react";
import type { Persona, Scenario } from "@/lib/client/api";
import type { Level } from "@/lib/competency";
import { PRACTICE_AREAS, PRACTICE_AREA_SHORT, type PracticeArea } from "@/lib/practice-areas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScenarioCard } from "./scenario-card";
import { BriefingDrawer } from "./briefing-drawer";
import { StorylineList, type HubStoryboard } from "./storyline-list";

export type HubScenario = Scenario & { persona: Persona | null; bestScore: number | null };

const TABS = [
  { id: "conversations", label: "Conversations", Icon: MessagesSquare },
  { id: "storylines", label: "Storylines", Icon: PanelsTopLeft },
] as const;
type Tab = (typeof TABS)[number]["id"];

/** Updates the query string in place. Passing `null` state lets Next.js sync `useSearchParams` without a server round trip. */
function editQuery(edit: (q: URLSearchParams) => void) {
  try {
    const url = new URL(window.location.href);
    edit(url.searchParams);
    window.history.replaceState(null, "", url);
  } catch {
    // URL sync is a nicety only.
  }
}

const freeFirst = (a: HubScenario, b: HubScenario) => Number(a.isPro) - Number(b.isPro);

export function PracticeHub({
  scenarios,
  storyboards,
  targetLevel,
}: {
  scenarios: HubScenario[];
  storyboards: HubStoryboard[];
  targetLevel: Level;
}) {
  const params = useSearchParams();
  const startId = params.get("start");
  const startScenario = startId ? scenarios.find((s) => s.id === startId) : undefined;
  const tabParam = params.get("tab");
  const tab: Tab = tabParam === "storylines" || (tabParam !== "conversations" && startScenario?.kind === "storyboard") ? "storylines" : "conversations";
  const open = startScenario?.kind === "simulation" ? startScenario : undefined;

  const [area, setArea] = useState<PracticeArea | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const conversations = scenarios.filter((s) => s.kind === "simulation" && (!area || s.practiceArea === area)).sort(freeFirst);
  const cases = scenarios.filter((s) => s.kind === "storyboard").sort(freeFirst);

  function selectTab(next: Tab) {
    editQuery((q) => {
      q.delete("start");
      if (next === "storylines") q.set("tab", next);
      else q.delete("tab");
    });
  }

  function setDrawer(id: string | null) {
    editQuery((q) => {
      if (id) q.set("start", id);
      else q.delete("start");
    });
  }

  function onTabKey(e: KeyboardEvent, i: number) {
    const next =
      e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i - 1 + TABS.length) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    selectTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="m-0 text-ink-2">Practise a client conversation or build a storyline, then get feedback scored at your target level.</p>

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
              onClick={() => selectTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`inline-flex h-9 flex-none cursor-pointer items-center gap-2 rounded-full border-0 px-4 text-sm whitespace-nowrap transition-colors ${
                active ? "bg-primary font-semibold text-on-primary shadow-sm" : "bg-transparent font-medium text-ink-2 hover:bg-hover hover:text-ink"
              }`}
            >
              <t.Icon size={16} aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="flex flex-col gap-6">
        {tab === "conversations" ? (
          <>
            <AreaFilter value={area} onChange={setArea} />
            <p className="sr-only" aria-live="polite">
              {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
            </p>
            {conversations.length === 0 ? (
              <Empty text={area ? "No conversations in this area yet." : "No conversations here yet."}>
                {area && (
                  <Button variant="secondary" size="sm" onClick={() => setArea(null)}>
                    Show all areas
                  </Button>
                )}
              </Empty>
            ) : (
              <CardGrid scenarios={conversations} onOpen={setDrawer} />
            )}
          </>
        ) : (
          <>
            {cases.length === 0 ? <Empty text="No storyline cases yet." /> : <CardGrid scenarios={cases} onOpen={setDrawer} />}
            {storyboards.length > 0 && <StorylineList storyboards={storyboards} />}
          </>
        )}
      </div>

      {open && <BriefingDrawer key={open.id} scenario={open} targetLevel={targetLevel} onClose={() => setDrawer(null)} />}
    </div>
  );
}

function CardGrid({ scenarios, onOpen }: { scenarios: HubScenario[]; onOpen: (id: string) => void }) {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
      {scenarios.map((s) => (
        <li key={s.id} className="flex">
          <ScenarioCard scenario={s} onOpen={s.kind === "simulation" ? () => onOpen(s.id) : undefined} />
        </li>
      ))}
    </ul>
  );
}

function Empty({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <SearchX size={24} className="text-muted" aria-hidden />
      <p className="m-0 text-sm text-muted">{text}</p>
      {children}
    </Card>
  );
}

/** Single-choice practice-area filter as a row of pill toggles. */
function AreaFilter({ value, onChange }: { value: PracticeArea | null; onChange: (a: PracticeArea | null) => void }) {
  const options: { id: PracticeArea | null; label: string }[] = [{ id: null, label: "All areas" }, ...PRACTICE_AREAS.map((a) => ({ id: a, label: PRACTICE_AREA_SHORT[a] }))];
  return (
    <div role="group" aria-label="Filter by practice area" className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id ?? "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={`inline-flex h-8 cursor-pointer items-center rounded-full border px-3.5 text-[13px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
              active ? "border-primary/40 bg-primary-tint font-semibold text-primary" : "border-border bg-surface font-medium text-ink-2 hover:bg-hover hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

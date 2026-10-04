"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { BookOpen, Check, ChevronDown, ChevronRight, MessagesSquare, PanelsTopLeft, Presentation, Target } from "lucide-react";

interface Item {
  kind: "lesson" | "scenario";
  refId: string;
  title: string;
  done: boolean;
  href: string;
  mode: string;
  durationMin: number | null;
}
interface Week {
  week: number;
  theme: string;
  items: Item[];
}

const PREFIX: Record<string, string> = { lesson: "Lesson", simulation: "Sim", storyboard: "Studio", rehearsal: "Rehearsal" };
const ICON = { lesson: BookOpen, simulation: MessagesSquare, storyboard: PanelsTopLeft, rehearsal: Presentation } as const;

export function PlanAccordion({ weeks, currentWeek }: { weeks: Week[]; currentWeek: number | null }) {
  const [open, setOpen] = useState<number | null>(currentWeek ?? weeks[0]?.week ?? null);
  const uid = useId();
  return (
    <ol className="m-0 flex list-none flex-col gap-2 p-0">
      {weeks.map((w) => {
        const isOpen = open === w.week;
        const isCurrent = w.week === currentWeek;
        const done = w.items.filter((x) => x.done).length;
        const complete = w.items.length > 0 && done === w.items.length;
        const panelId = `${uid}-week-${w.week}`;
        return (
          <li
            key={w.week}
            className={`overflow-hidden rounded-lg border transition-colors ${
              isCurrent ? "border-primary/30 bg-primary-tint/40" : "border-border bg-surface"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : w.week)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-3 text-left text-ink hover:bg-hover/60"
            >
              <span
                aria-hidden
                className={`flex h-8 w-8 flex-none items-center justify-center rounded-md text-xs font-semibold ${
                  complete ? "bg-success-tint text-success" : isCurrent ? "bg-primary text-on-primary" : "bg-hover text-ink-2"
                }`}
              >
                {complete ? <Check size={16} strokeWidth={2.5} /> : `W${w.week}`}
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-snug">
                <span className="text-xs font-medium text-muted">Week {w.week}</span>
                <span className="truncate text-[15px] font-semibold">{w.theme}</span>
              </span>
              {isCurrent && (
                <span className="hidden h-6 flex-none items-center rounded-full bg-accent-tint px-2.5 text-xs font-semibold text-accent-ink sm:inline-flex">
                  This week
                </span>
              )}
              <span className="tabular flex-none text-[13px] text-muted">
                {done}/{w.items.length}
                <span className="sr-only"> done</span>
              </span>
              <ChevronDown size={16} aria-hidden className={`flex-none text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div id={panelId} className="flex flex-col gap-0.5 px-2 pb-2">
                {w.items.length === 0 && <p className="m-0 px-2 py-2.5 text-sm text-muted">Nothing scheduled.</p>}
                {w.items.map((it) => {
                  const Icon = ICON[it.mode as keyof typeof ICON] ?? Target;
                  return (
                    <Link
                      key={`${it.kind}-${it.refId}`}
                      href={it.href}
                      className="group flex items-center gap-3 rounded-md px-2 py-2.5 text-ink no-underline transition-colors hover:bg-surface"
                    >
                      <span
                        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ${
                          it.done ? "bg-success text-on-primary" : "border-[1.5px] border-border-strong bg-surface"
                        }`}
                      >
                        {it.done && <Check size={12} strokeWidth={3} aria-hidden />}
                        <span className="sr-only">{it.done ? "Done:" : "To do:"}</span>
                      </span>
                      <Icon size={16} className="flex-none text-muted" aria-hidden />
                      <span className={`min-w-0 flex-1 text-sm ${it.done ? "text-muted line-through decoration-faint" : "font-medium"}`}>
                        {PREFIX[it.mode] ?? "Sim"} · {it.title}
                      </span>
                      {it.durationMin != null && <span className="tabular flex-none text-[13px] text-muted">{it.durationMin} min</span>}
                      {!it.done && (
                        <ChevronRight size={16} className="flex-none text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

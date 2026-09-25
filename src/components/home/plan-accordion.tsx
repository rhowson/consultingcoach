"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Check, ChevronDown, ChevronRight, ChevronUp, PanelsTopLeft, Target } from "lucide-react";

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
const ICON = { lesson: BookOpen, simulation: Target, storyboard: PanelsTopLeft, rehearsal: Target } as const;

export function PlanAccordion({ weeks, currentWeek }: { weeks: Week[]; currentWeek: number | null }) {
  const [open, setOpen] = useState<number | null>(currentWeek ?? weeks[0]?.week ?? null);
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border">
      {weeks.map((w, i) => {
        const isOpen = open === w.week;
        const isCurrent = w.week === currentWeek;
        const done = w.items.filter((x) => x.done).length;
        return (
          <div key={w.week} className={i ? "border-t border-border" : ""}>
            <button
              onClick={() => setOpen(isOpen ? null : w.week)}
              aria-expanded={isOpen}
              className={`flex w-full cursor-pointer items-center gap-3 border-0 px-4 py-3.5 text-left text-ink ${isCurrent ? "bg-surface" : "bg-subtle"}`}
            >
              <span className="w-[52px] flex-none text-xs font-semibold text-muted">Week {w.week}</span>
              <span className="min-w-0 flex-1 text-[15px] font-semibold">{w.theme}</span>
              {isCurrent && <span className="rounded-full bg-accent-tint px-2.5 py-px text-xs font-semibold">This week</span>}
              <span className="tabular text-[13px] text-muted">
                {done}/{w.items.length}
              </span>
              {isOpen ? <ChevronUp size={16} className="text-muted" aria-hidden /> : <ChevronDown size={16} className="text-muted" aria-hidden />}
            </button>
            {isOpen && (
              <div className={`flex flex-col px-4 pb-2 ${isCurrent ? "bg-surface" : "bg-subtle"}`}>
                {w.items.length === 0 && <p className="m-0 border-t border-divider py-2.5 text-sm text-muted">Nothing scheduled.</p>}
                {w.items.map((it) => {
                  const Icon = ICON[it.mode as keyof typeof ICON] ?? Target;
                  return (
                    <Link key={`${it.kind}-${it.refId}`} href={it.href} className="flex items-center gap-3 border-t border-divider py-2.5 text-ink no-underline">
                      <span
                        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-white ${
                          it.done ? "border border-success bg-success" : "border-[1.5px] border-border-strong bg-surface"
                        }`}
                      >
                        {it.done && <Check size={12} strokeWidth={2.5} aria-hidden />}
                      </span>
                      <Icon size={16} className="text-muted" aria-hidden />
                      <span className={`min-w-0 flex-1 text-sm ${it.done ? "text-muted" : ""}`}>
                        {PREFIX[it.mode] ?? "Sim"} · {it.title}
                      </span>
                      {it.durationMin != null && <span className="tabular text-[13px] text-muted">{it.durationMin} min</span>}
                      {!it.done && <ChevronRight size={16} className="text-primary" aria-hidden />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Check, ChevronRight, Clock } from "lucide-react";
import { COMPETENCIES, COMPETENCY_LABELS, LEVEL_LABELS, type Competency, type Level } from "@/lib/competency";
import { Card } from "@/components/ui/card";
import { CompetencyChip } from "@/components/ui/badges";
import { CompetencyIcon } from "@/components/ui/icons";

interface TrackLesson {
  id: string;
  title: string;
  level: Level;
  durationMin: number;
  completed: boolean;
}
export interface TrackData {
  id: string;
  title: string;
  description: string;
  competency: Competency;
  lessonCount: number;
  durationMin: number;
  completedCount: number;
  lessons: TrackLesson[];
}

export function TrackList({ tracks }: { tracks: TrackData[] }) {
  const [filter, setFilter] = useState<Competency | "all">("all");
  const present = COMPETENCIES.filter((c) => tracks.some((t) => t.competency === c));
  const shown = filter === "all" ? tracks : tracks.filter((t) => t.competency === filter);

  if (tracks.length === 0) {
    return (
      <Card className="flex items-center gap-3 p-6 text-sm text-muted">
        <BookOpen size={18} aria-hidden /> No tracks yet. New lessons are on the way.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Filter by competency" className="flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All tracks
        </FilterChip>
        {present.map((c) => (
          <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)}>
            <CompetencyIcon competency={c} size={14} />
            {COMPETENCY_LABELS[c]}
          </FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {shown.map((t) => (
          <TrackCard key={t.id} track={t} />
        ))}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors ${
        active ? "border-primary bg-primary text-on-primary" : "border-border bg-surface text-ink-2 hover:bg-hover"
      }`}
    >
      {children}
    </button>
  );
}

function TrackCard({ track: t }: { track: TrackData }) {
  const pct = t.lessonCount ? t.completedCount / t.lessonCount : 0;
  const nextId = t.lessons.find((l) => !l.completed)?.id;
  return (
    <Card aria-labelledby={`track-${t.id}`} className="flex flex-col gap-4 p-6">
      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <CompetencyChip competency={t.competency} />
          <h2 id={`track-${t.id}`} className="m-0 font-serif text-xl leading-snug font-semibold">
            {t.title}
          </h2>
        </div>
        <ProgressRing value={pct} label={`${t.completedCount} of ${t.lessonCount} lessons complete`} />
      </div>
      <p className="m-0 text-sm text-ink-2">{t.description}</p>
      <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted">
        <span className="flex items-center gap-1.5">
          <BookOpen size={15} aria-hidden />
          {t.lessonCount} {t.lessonCount === 1 ? "lesson" : "lessons"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={15} aria-hidden />
          {t.durationMin} min
        </span>
        <span className="tabular">
          {t.completedCount}/{t.lessonCount} done
        </span>
      </div>
      <ol className="m-0 flex list-none flex-col border-t border-border p-0">
        {t.lessons.map((l, i) => (
          <li key={l.id} className="border-b border-divider last:border-b-0">
            <Link
              href={`/learn/${l.id}`}
              className="flex items-center gap-3 rounded-md py-2.5 text-ink no-underline hover:bg-subtle"
            >
              <span
                className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-white ${
                  l.completed ? "border border-success bg-success" : "border-[1.5px] border-border-strong bg-surface"
                }`}
              >
                {l.completed && <Check size={12} strokeWidth={2.5} aria-hidden />}
              </span>
              <span className={`min-w-0 flex-1 text-sm ${l.completed ? "text-muted" : ""}`}>
                <span className="tabular text-muted">{i + 1}.</span> {l.title}
                <span className="sr-only">{l.completed ? " (completed)" : ""}</span>
              </span>
              <span className="hidden text-xs text-muted sm:inline">{LEVEL_LABELS[l.level]}</span>
              <span className="tabular text-[13px] text-muted">{l.durationMin} min</span>
              {l.id === nextId && <ChevronRight size={16} className="text-primary" aria-hidden />}
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex h-14 w-14 flex-none items-center justify-center" role="img" aria-label={label}>
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--hover)" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={value >= 1 ? "var(--success)" : "var(--primary)"}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${c * value} ${c}`}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <span className="tabular absolute text-xs font-semibold" aria-hidden>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

import Link from "next/link";
import { BookOpen, Briefcase, Check, ChevronRight, ClipboardList, Clock, GraduationCap } from "lucide-react";
import { BUSINESS_DEVELOPMENT_TRACK_IDS, ENGAGEMENT_TRACK_IDS } from "@/lib/learn-groups";
import { LEVEL_LABELS, type Competency, type Level } from "@/lib/competency";
import { Card } from "@/components/ui/card";

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

const GROUPS = [
  {
    id: "core",
    title: "Core consulting skills",
    description: "Problem solving, storylining, outputs and client conversations, from Analyst up.",
    Icon: GraduationCap,
    match: (t: TrackData) => !ENGAGEMENT_TRACK_IDS.includes(t.id) && !BUSINESS_DEVELOPMENT_TRACK_IDS.includes(t.id),
  },
  {
    id: "engagements",
    title: "Running engagements",
    description: "Set up, staff and run an engagement end to end, from signed proposal to handover.",
    Icon: ClipboardList,
    match: (t: TrackData) => ENGAGEMENT_TRACK_IDS.includes(t.id),
  },
  {
    id: "bd",
    title: "Client leadership & business development",
    description: "For client directors and anyone who sells services: grow accounts, win work and hold the fee.",
    Icon: Briefcase,
    match: (t: TrackData) => BUSINESS_DEVELOPMENT_TRACK_IDS.includes(t.id),
  },
] as const;

export function TrackList({ tracks }: { tracks: TrackData[] }) {
  if (tracks.length === 0) {
    return (
      <Card className="flex items-center gap-3 p-6 text-sm text-muted">
        <BookOpen size={18} aria-hidden /> No tracks yet. New lessons are on the way.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {GROUPS.map((g) => {
        const items = tracks.filter(g.match);
        if (!items.length) return null;
        return (
          <section key={g.id} aria-labelledby={`group-${g.id}`} className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-primary-tint text-primary">
                <g.Icon size={20} aria-hidden />
              </span>
              <div className="flex flex-col">
                <h2 id={`group-${g.id}`} className="m-0 font-display text-xl font-semibold tracking-tight">
                  {g.title}
                </h2>
                <p className="m-0 text-sm text-muted">{g.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {items.map((t) => (
                <TrackCard key={t.id} track={t} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TrackCard({ track: t }: { track: TrackData }) {
  const pct = t.lessonCount ? t.completedCount / t.lessonCount : 0;
  const nextId = t.lessons.find((l) => !l.completed)?.id;
  return (
    <Card aria-labelledby={`track-${t.id}`} className="flex flex-col gap-4 p-6">
      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h3 id={`track-${t.id}`} className="m-0 font-serif text-xl leading-snug font-semibold">
            {t.title}
          </h3>
          <p className="m-0 text-sm text-ink-2">{t.description}</p>
        </div>
        <ProgressRing value={pct} label={`${t.completedCount} of ${t.lessonCount} lessons complete`} />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted">
        <span className="flex items-center gap-1.5">
          <BookOpen size={15} aria-hidden />
          {t.lessonCount} {t.lessonCount === 1 ? "lesson" : "lessons"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={15} aria-hidden />
          {t.durationMin} min
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
                className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-on-primary ${
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

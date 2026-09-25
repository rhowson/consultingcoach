import { Clock, Lightbulb, X } from "lucide-react";
import { LEVEL_LABELS, type Level } from "@/lib/competency";

export const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** SessionHeader: exit, title, timer, target level, hint, end. */
export function SessionHeader({
  title,
  subtitle,
  elapsed,
  durationMin,
  targetLevel,
  hintsLeft,
  hintBusy,
  live,
  onExit,
  onHint,
  onEnd,
}: {
  title: string;
  subtitle: string;
  elapsed: number;
  durationMin: number;
  targetLevel: Level;
  hintsLeft: number;
  hintBusy: boolean;
  live: boolean;
  onExit: () => void;
  onHint: () => void;
  onEnd: () => void;
}) {
  const over = elapsed > durationMin * 60;
  return (
    <header className="flex h-[60px] flex-none items-center gap-2 border-b border-border bg-surface px-4 sm:gap-3 lg:px-6">
      <button
        type="button"
        onClick={onExit}
        aria-label="Exit session"
        className="flex h-9 flex-none items-center gap-1.5 rounded-md bg-transparent px-2.5 text-sm font-medium text-ink-2 hover:bg-hover"
      >
        <X size={18} aria-hidden />
        <span className="hidden lg:inline">Exit</span>
      </button>
      <span className="h-6 w-px flex-none bg-border" aria-hidden />
      <div className="flex min-w-0 flex-col leading-tight">
        <h1 className="m-0 truncate font-serif text-[17px] font-semibold">{title}</h1>
        <span className="hidden truncate text-xs text-muted lg:block">{subtitle}</span>
      </div>
      <div className="flex-1" />
      <span role="timer" aria-label={`Time elapsed ${fmtClock(elapsed)} of ${durationMin} minutes`} className="tabular flex flex-none items-center gap-1.5 text-sm text-ink-2">
        <Clock size={16} className={over ? "text-warning" : "text-muted"} aria-hidden />
        <span aria-hidden>{fmtClock(elapsed)}</span>
        <span className="hidden text-muted lg:inline" aria-hidden>
          / {fmtClock(durationMin * 60)}
        </span>
      </span>
      <span className="hidden flex-none items-center gap-1.5 text-[13px] text-muted lg:flex">
        Target
        <span className="rounded-full border border-primary px-2 py-px text-xs font-semibold text-primary">{LEVEL_LABELS[targetLevel]}</span>
      </span>
      <button
        type="button"
        onClick={onHint}
        disabled={!live || hintsLeft <= 0 || hintBusy}
        aria-label={`Get a hint, ${hintsLeft} left`}
        className="flex h-9 flex-none items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-sm font-medium text-ink hover:bg-hover disabled:cursor-not-allowed disabled:text-faint sm:px-3"
      >
        <Lightbulb size={16} aria-hidden />
        <span className="hidden sm:inline">Hint</span>
        <span className="tabular text-muted">{hintsLeft}</span>
      </button>
      <button
        type="button"
        onClick={onEnd}
        disabled={!live}
        className="h-9 flex-none rounded-md bg-primary px-3 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:px-3.5"
      >
        <span className="lg:hidden">End</span>
        <span className="hidden lg:inline">End conversation</span>
      </button>
    </header>
  );
}

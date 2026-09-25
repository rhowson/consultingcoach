"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Lightbulb, X } from "lucide-react";
import { LEVEL_LABELS, type Level } from "@/lib/competency";

/** Full-screen session header: Exit · title/subtitle · right-hand controls. */
export function SessionHeader({
  title,
  subtitle,
  onExit,
  children,
}: {
  title: string;
  subtitle: string;
  onExit: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="flex h-[60px] flex-none items-center gap-3 border-b border-border bg-surface px-4 md:px-8">
      <button
        type="button"
        onClick={onExit}
        aria-label="Exit session"
        className="flex h-9 flex-none items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-ink-2 hover:bg-hover"
      >
        <X size={18} aria-hidden />
        <span className="hidden md:inline">Exit</span>
      </button>
      <span className="h-6 w-px flex-none bg-border" aria-hidden />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-serif text-[17px] font-semibold">{title}</span>
        <span className="hidden truncate text-xs text-muted md:block">{subtitle}</span>
      </div>
      <div className="flex-1" />
      {children}
    </header>
  );
}

export function TargetPill({ level }: { level: Level }) {
  return (
    <span className="hidden items-center gap-1.5 text-[13px] whitespace-nowrap text-muted md:flex">
      Target
      <span className="rounded-full border border-primary px-[9px] py-px text-xs font-semibold text-primary">{LEVEL_LABELS[level]}</span>
    </span>
  );
}

export function HintButton({ left, onClick }: { left: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={left <= 0}
      aria-label={`Get a hint, ${left} left`}
      className="hidden h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-ink hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 md:flex"
    >
      <Lightbulb size={16} aria-hidden />
      Hint
      <span className="tabular text-muted">{left}</span>
    </button>
  );
}

export function HintBanner({ text, onDismiss, className = "" }: { text: string; onDismiss: () => void; className?: string }) {
  return (
    <div role="status" className={`flex items-start gap-2.5 rounded-md bg-accent-tint px-3 py-2.5 text-sm ${className}`}>
      <Lightbulb size={16} className="mt-0.5 flex-none text-accent-ink" aria-hidden />
      <span className="flex-1">{text}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss hint" className="rounded text-muted hover:text-ink">
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}

/** Modal confirmation dialog with focus trap-lite (focuses the first button, Esc closes). */
export function ConfirmDialog({
  title,
  body,
  onCancel,
  cancelLabel,
  children,
}: {
  title: string;
  body: ReactNode;
  onCancel: () => void;
  cancelLabel: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button, a")?.focus();
    return () => prev?.focus?.();
  }, []);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 p-4" onClick={onCancel}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[420px] flex-col gap-3 rounded-lg bg-surface p-6 shadow-[0_16px_48px_rgba(17,24,39,.18)]"
      >
        <h2 id="confirm-title" className="m-0 font-serif text-xl font-semibold">
          {title}
        </h2>
        <div className="text-sm text-ink-2">{body}</div>
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-hover"
          >
            {cancelLabel}
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Loading shimmer lines used while the coach works. */
export function Shimmer({ widths = ["100%", "82%", "60%"], center = false }: { widths?: string[]; center?: boolean }) {
  return (
    <div className="flex w-full flex-col gap-2" aria-hidden>
      {widths.map((w, i) => (
        <div key={i} className={`h-2.5 animate-pulse rounded-full bg-hover ${center ? "self-center" : ""}`} style={{ width: w }} />
      ))}
    </div>
  );
}

export const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

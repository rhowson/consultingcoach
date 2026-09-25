"use client";

import { Check, CircleCheck, MessageSquare, PanelRightClose } from "lucide-react";
import type { StudioComment } from "@/lib/types";
import { SEVERITY, TAG_LABEL } from "./model";
import { Pin } from "./pin";
import { Shimmer } from "./session-header";

export interface CommentView {
  comment: StudioComment;
  pin: number;
  target: string;
  /** Present when the suggestion can be written into the target. */
  onApply?: () => void;
}

export function CoachPanel({
  comments,
  resolvedCount,
  reviewed,
  reviewing,
  tip,
  error,
  busyId,
  onAsk,
  onResolve,
  onFocusTarget,
  onCollapse,
  className = "",
}: {
  comments: CommentView[];
  resolvedCount: number;
  reviewed: boolean;
  reviewing: boolean;
  tip: string;
  error: string | null;
  busyId: string | null;
  onAsk: () => void;
  onResolve: (id: string) => void;
  onFocusTarget: (targetId: string) => void;
  onCollapse?: () => void;
  className?: string;
}) {
  return (
    <aside aria-label="Coach" className={`flex min-h-0 flex-none flex-col bg-surface ${className}`}>
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="m-0 font-serif text-lg font-semibold">Coach</h2>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Collapse coach panel"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-ink"
            >
              <PanelRightClose size={18} aria-hidden />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onAsk}
          disabled={reviewing}
          className="flex h-10 items-center justify-center gap-2 rounded-md border border-primary bg-surface text-sm font-semibold text-primary hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MessageSquare size={16} aria-hidden />
          {reviewing ? "Reviewing…" : reviewed ? "Review again" : "Ask for review"}
        </button>
      </div>
      <div aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        {error && (
          <p role="alert" className="m-0 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        {reviewing && (
          <div role="status" className="flex flex-col gap-2.5">
            <span className="text-sm font-semibold">Coach is reviewing…</span>
            <Shimmer />
            <span className="text-[13px] text-muted">{tip}</span>
          </div>
        )}
        {!reviewing && comments.length === 0 && (
          <div className="flex flex-col items-start gap-2 py-2">
            <MessageSquare size={24} className="text-faint" aria-hidden />
            <span className="text-sm font-semibold">No comments on this stage yet</span>
            <span className="text-sm text-muted">Ask for a review whenever you&apos;re ready. Comments pin to the node or slide they&apos;re about.</span>
          </div>
        )}
        {!reviewing &&
          comments.map(({ comment: c, pin, target, onApply }) => (
            <article key={c.id} className="flex flex-col gap-2.5 rounded-lg border border-border p-3.5">
              <div className="flex items-center gap-2">
                <Pin small n={pin} />
                <span className="rounded-full bg-hover px-2 py-px text-xs font-semibold text-ink-2">{TAG_LABEL[c.tag]}</span>
                <span className={`text-xs font-semibold whitespace-nowrap ${SEVERITY[c.severity].cls}`}>{SEVERITY[c.severity].label}</span>
                <button
                  type="button"
                  onClick={() => onFocusTarget(c.targetId)}
                  className="ml-auto min-w-0 truncate rounded text-xs text-muted hover:text-primary hover:underline"
                >
                  {target}
                </button>
              </div>
              <p className="m-0 text-sm leading-normal text-pretty text-ink">{c.body}</p>
              {c.suggestion && (
                <div className="flex flex-col gap-0.5 rounded-md bg-success-tint px-3 py-2.5">
                  <span className="text-[11px] font-semibold tracking-[.06em] text-success uppercase">Suggested rewrite</span>
                  <span className="text-sm text-ink">{c.suggestion}</span>
                </div>
              )}
              <div className="flex gap-1.5">
                {onApply && (
                  <button
                    type="button"
                    onClick={onApply}
                    disabled={busyId === c.id}
                    className="h-8 rounded-md bg-primary px-2.5 text-[13px] font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
                  >
                    Apply rewrite
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onResolve(c.id)}
                  disabled={busyId === c.id}
                  className="flex h-8 items-center gap-1 rounded-md border border-border bg-surface px-2.5 text-[13px] font-medium text-ink hover:bg-hover disabled:opacity-60"
                >
                  <Check size={14} aria-hidden />
                  Resolve
                </button>
              </div>
            </article>
          ))}
        {!reviewing && resolvedCount > 0 && (
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <CircleCheck size={14} className="text-success" aria-hidden />
            {resolvedCount} resolved
          </span>
        )}
      </div>
    </aside>
  );
}

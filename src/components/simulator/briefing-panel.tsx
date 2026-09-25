"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, StickyNote, Target } from "lucide-react";
import type { Briefing } from "@/lib/types";

/** Left panel: collapsible briefing plus a private notes scratchpad saved to localStorage. */
export function BriefingPanel({ briefing, notesKey }: { briefing: Briefing; notesKey: string }) {
  const [open, setOpen] = useState(true);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(notesKey);
      if (saved && notesRef.current && !notesRef.current.value) notesRef.current.value = saved;
    } catch {
      // Storage can be unavailable (private mode); notes just won't persist.
    }
  }, [notesKey]);

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="brief-body"
        className="eyebrow flex items-center justify-between rounded-sm bg-transparent p-0 text-left"
      >
        Briefing
        {open ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
      </button>
      {open && (
        <div id="brief-body" className="flex flex-col gap-4 text-sm leading-relaxed">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Situation</span>
            <span className="text-ink-2">{briefing.situation}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Your role</span>
            <span className="text-ink-2">{briefing.yourRole}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-md bg-subtle px-3.5 py-3">
            <span className="flex items-center gap-1.5 font-semibold">
              <Target size={16} className="text-primary" aria-hidden />
              Objective
            </span>
            <span className="text-ink">{briefing.objective}</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <label htmlFor={`notes-${notesKey}`} className="eyebrow flex items-center gap-1.5">
          <StickyNote size={14} aria-hidden />
          Notes
        </label>
        <textarea
          id={`notes-${notesKey}`}
          ref={notesRef}
          onChange={(e) => {
            try {
              window.localStorage.setItem(notesKey, e.target.value);
            } catch {
              // Ignore storage failures.
            }
          }}
          placeholder="Private scratchpad. Not scored."
          className="min-h-[140px] resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-sm leading-normal text-ink placeholder:text-faint"
        />
      </div>
    </div>
  );
}

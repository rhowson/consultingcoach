"use client";

import { useEffect, useRef } from "react";

/** "Leave this session?" confirmation. Native modal <dialog>: focus is trapped and Esc cancels. */
export function ExitDialog({ onCancel, onLeave, leaving }: { onCancel: () => void; onLeave: () => void; leaving: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    keepRef.current?.focus();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="exit-title"
      aria-describedby="exit-desc"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[420px] rounded-lg border-0 bg-surface p-6 text-ink shadow-2xl backdrop:bg-black/40"
    >
      <div className="flex flex-col gap-3">
        <h2 id="exit-title" className="m-0 font-serif text-xl font-semibold">
          Leave this session?
        </h2>
        <p id="exit-desc" className="m-0 text-sm text-ink-2">
          Your transcript is saved, but this rep won&apos;t be scored or count toward your streak.
        </p>
        <div className="mt-2 flex justify-end gap-2">
          <button
            ref={keepRef}
            type="button"
            onClick={onCancel}
            className="h-10 rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-hover"
          >
            Keep going
          </button>
          <button
            type="button"
            onClick={onLeave}
            disabled={leaving}
            className="h-10 rounded-md bg-danger px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {leaving ? "Leaving…" : "Leave session"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

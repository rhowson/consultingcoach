"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shows a freshly issued candidate link once, with a Copy button. */
export function LinkPanel({ link, candidateName, onDismiss }: { link: string; candidateName: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, [link]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("copied");
    } catch {
      inputRef.current?.select();
      setCopied("failed");
    }
  }

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-label={`Interview link for ${candidateName}`}
      className="flex flex-col gap-3 rounded-lg border border-accent bg-accent-tint p-4 outline-none print:hidden md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <KeyRound size={18} className="mt-0.5 flex-none text-accent-ink" aria-hidden />
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-ink">Interview link for {candidateName}</span>
            <span className="text-sm text-ink-2">
              Copy it now and send it to the candidate. <strong>For security it won&apos;t be shown again.</strong> If you lose it, you can
              regenerate a new link from the report until the candidate starts.
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onDismiss} aria-label="Dismiss link" className="-mt-1 -mr-1 px-2">
          <X size={16} aria-hidden />
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="iv-link" className="sr-only">
          Candidate link
        </label>
        <input
          ref={inputRef}
          id="iv-link"
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 font-mono text-[13px] text-ink focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
        />
        <Button onClick={copy} className="h-10">
          {copied === "copied" ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
          {copied === "copied" ? "Copied" : "Copy link"}
        </Button>
      </div>
      <span role="status" className="text-[13px] text-ink-2">
        {copied === "copied"
          ? "Link copied to the clipboard."
          : copied === "failed"
            ? "Couldn't copy automatically. The link is selected: press Ctrl+C (or ⌘C) to copy it."
            : "The link is valid for 14 days. Once the candidate starts, every section is timed."}
      </span>
    </div>
  );
}

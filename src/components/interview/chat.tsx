"use client";

import { forwardRef } from "react";
import { ArrowUp, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import { PersonaAvatar } from "@/components/ui/avatar";
import type { PersonaView } from "./client";

export function CandidateBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex max-w-[88%] flex-col items-end gap-1 self-end">
      <span className="text-xs text-muted">You</span>
      <div className="rounded-[12px_4px_12px_12px] bg-primary px-3.5 py-2.5 text-[15px] break-words whitespace-pre-wrap text-on-primary">{children}</div>
    </div>
  );
}

function AssistantMark() {
  return (
    <span aria-hidden className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-accent-tint text-accent-ink">
      <Sparkles size={15} />
    </span>
  );
}

export function AssistantBubble({ children, label = "AI assistant" }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="flex max-w-[94%] items-start gap-2.5">
      <AssistantMark />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-semibold text-ink-2">{label}</span>
        <div className="rounded-[4px_12px_12px_12px] border border-border bg-surface px-3.5 py-2.5 text-[15px] break-words whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  );
}

export function PreReadBubble({ text }: { text: string }) {
  return (
    <div className="flex max-w-[94%] items-start gap-2.5">
      <AssistantMark />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-semibold text-ink-2">AI pre-read (auto-generated)</span>
        <div className="rounded-[4px_12px_12px_12px] border border-border bg-surface px-3.5 py-2.5 text-[15px] break-words whitespace-pre-wrap">{text}</div>
        <span className="inline-flex items-center gap-1 text-xs text-warning-ink">
          <TriangleAlert size={12} aria-hidden />
          AI output can be wrong — check before you rely on it.
        </span>
      </div>
    </div>
  );
}

export function RefusalBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex max-w-[94%] items-start gap-2.5">
      <span aria-hidden className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-hover text-muted">
        <ShieldAlert size={15} />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-semibold text-muted">Assistant declined · guardrail</span>
        <div className="rounded-[4px_12px_12px_12px] border border-dashed border-border-strong bg-subtle px-3.5 py-2.5 text-[15px] break-words whitespace-pre-wrap text-muted italic">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ClientBubble({ persona, children }: { persona: PersonaView; children: React.ReactNode }) {
  return (
    <div className="flex max-w-[88%] items-start gap-3">
      <PersonaAvatar id={persona.id} name={persona.name} size={36} />
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
          <span className="font-semibold">{persona.name}</span>
          <span className="text-muted">
            {persona.title}, {persona.company}
          </span>
        </div>
        <div className="rounded-[4px_12px_12px_12px] border border-border bg-surface px-4 py-3 break-words whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  );
}

export function TypingDots({ label, avatar }: { label: string; avatar: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      {avatar}
      <div role="img" aria-label={label} className="flex rounded-[4px_12px_12px_12px] border border-border bg-surface px-4 py-3.5">
        <span className="inline-flex h-3 items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="iv-dot h-1.5 w-1.5 rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      </div>
    </div>
  );
}

export const AssistantTyping = () => <TypingDots label="The assistant is thinking" avatar={<AssistantMark />} />;

/** Enter sends, Shift+Enter is a new line. Read-only (not disabled) while waiting so focus stays put. */
export const Composer = forwardRef<
  HTMLTextAreaElement,
  {
    value: string;
    onChange: (v: string) => void;
    onSend: () => void;
    onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
    label: string;
    placeholder: string;
    waiting: boolean;
    disabled?: boolean;
  }
>(function Composer({ value, onChange, onSend, onPaste, label, placeholder, waiting, disabled }, ref) {
  const canSend = Boolean(value.trim()) && !waiting && !disabled;
  return (
    <div className="flex items-end gap-2 rounded-lg border border-border-strong bg-surface py-1.5 pr-1.5 pl-3 transition-colors duration-150 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        aria-label={label}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={waiting}
        aria-disabled={waiting || undefined}
        className="field-sizing-content max-h-40 min-h-9 flex-1 resize-none border-0 bg-transparent py-1.5 text-[15px] leading-normal text-ink placeholder:text-faint focus-visible:outline-none disabled:cursor-not-allowed"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send"
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-md text-on-primary transition-colors duration-150 ${
          canSend ? "bg-primary hover:bg-primary-hover" : "cursor-not-allowed bg-faint"
        }`}
      >
        <ArrowUp size={18} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
});

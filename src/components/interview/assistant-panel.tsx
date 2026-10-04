"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, Sparkles, X } from "lucide-react";
import { toApiError, type AssistantLogEntry, type InterviewApi } from "./client";
import { AssistantBubble, AssistantTyping, CandidateBubble, Composer, PreReadBubble, RefusalBubble } from "./chat";

interface Msg {
  key: string;
  role: "candidate" | "assistant" | "refusal";
  content: string;
}

const fromLog = (log: AssistantLogEntry[]): Msg[] =>
  log.map((e, i) => ({ key: `log-${i}`, role: e.role === "candidate" ? "candidate" : e.blocked ? "refusal" : "assistant", content: e.content }));

/** The guarded case assistant (AI section only). Copying replies is allowed; pastes into the memo are logged. */
export function AssistantPanel({
  api,
  preRead,
  log,
  promptsLeft: initialLeft,
  live,
  onPaste,
}: {
  api: InterviewApi;
  preRead: string | null;
  log: AssistantLogEntry[];
  promptsLeft: number;
  live: boolean;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>(() => fromLog(log));
  const [left, setLeft] = useState(Math.max(0, initialLeft));
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, waiting]);

  async function send() {
    const text = input.trim();
    if (!text || waiting || !live || left <= 0) return;
    const key = `c-${Date.now()}`;
    setMessages((ms) => [...ms, { key, role: "candidate", content: text }]);
    setInput("");
    setWaiting(true);
    setError(null);
    try {
      const r = await api.ask(text);
      setMessages((ms) => [...ms, { key: `a-${Date.now()}`, role: r.blocked ? "refusal" : "assistant", content: r.reply }]);
      setLeft(Math.max(0, r.promptsLeft));
      setAnnounce(r.blocked ? `The assistant declined: ${r.reply}` : `Assistant: ${r.reply}`);
    } catch (e) {
      const err = toApiError(e);
      if (err.code === "assistant_limit") {
        setLeft(0);
        setError(err.message);
      } else {
        // The request wasn't answered: put it back so it can be resent.
        setMessages((ms) => ms.filter((m) => m.key !== key));
        setInput((cur) => (cur.trim() ? `${text}\n${cur}` : text));
        setError(err.code === "rate_limited" ? `${err.message} Wait a moment, then try again.` : `${err.message} Your message is back in the box below.`);
      }
    } finally {
      setWaiting(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  const out = left <= 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-none items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="m-0 flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles size={15} className="text-accent-ink" aria-hidden />
          AI assistant
        </h2>
        <span className={`tabular rounded-full px-2 py-px text-xs font-semibold ${left <= 3 ? "bg-warning-tint text-warning-ink" : "bg-hover text-ink-2"}`}>
          {left} {left === 1 ? "request" : "requests"} left
        </span>
      </div>

      <div ref={logRef} role="log" aria-label="Conversation with the AI assistant" className="flex min-h-[240px] flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {preRead && <PreReadBubble text={preRead} />}
        {messages.map((m) =>
          m.role === "candidate" ? (
            <CandidateBubble key={m.key}>{m.content}</CandidateBubble>
          ) : m.role === "refusal" ? (
            <RefusalBubble key={m.key}>{m.content}</RefusalBubble>
          ) : (
            <AssistantBubble key={m.key}>{m.content}</AssistantBubble>
          ),
        )}
        {waiting && <AssistantTyping />}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>

      <div className="flex flex-none flex-col gap-2 border-t border-border bg-surface px-4 pt-3 pb-4">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-tint px-3 py-2 text-[13px] text-danger">
            <CircleAlert size={15} className="mt-0.5 flex-none" aria-hidden />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="rounded-sm bg-transparent p-0 text-danger">
              <X size={15} aria-hidden />
            </button>
          </div>
        )}
        {out ? (
          <p role="status" className="m-0 rounded-md bg-subtle px-3 py-2.5 text-sm text-muted">
            You&apos;ve used all your assistant requests. Carry on with your memo.
          </p>
        ) : (
          <Composer
            ref={inputRef}
            value={input}
            onChange={setInput}
            onSend={() => void send()}
            onPaste={onPaste}
            label="Ask the AI assistant about the case"
            placeholder={waiting ? "The assistant is thinking…" : "Ask about the case…"}
            waiting={waiting}
            disabled={!live}
          />
        )}
        <p className="m-0 text-xs text-muted">Enter to send · Shift+Enter for a new line. Everything you send is recorded.</p>
      </div>
    </div>
  );
}

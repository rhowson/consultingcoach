"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, Play, Send } from "lucide-react";
import { api, ApiError, type SimulationView } from "@/lib/client/api";
import { PersonaAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/card";

interface Msg {
  key: string;
  role: "user" | "persona";
  content: string;
}

type Phase = "intro" | "starting" | "chat" | "scoring" | "done";

/**
 * Compact diagnostic conversation: start → up to `maxTurns` of the user's
 * turns → complete. The parent is told when the rep is finished (or skipped).
 */
export function MiniSim({
  scenarioId,
  maxTurns,
  onFinished,
  onSkip,
}: {
  scenarioId: string | null;
  maxTurns: number;
  onFinished: () => void;
  onSkip: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [view, setView] = useState<SimulationView | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [turnsUsed, setTurnsUsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, streaming]);

  async function start() {
    if (!scenarioId) return;
    setPhase("starting");
    setError(null);
    try {
      const v = await api.simulations.start({ scenarioId });
      setView(v);
      setMessages(v.messages.map((m) => ({ key: `m${m.turn}`, role: m.role, content: m.content })));
      setTurnsUsed(v.messages.filter((m) => m.role === "user").length);
      setPhase("chat");
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't start the conversation.");
      setPhase("intro");
    }
  }

  async function finish(id: string) {
    setPhase("scoring");
    try {
      await api.simulations.complete(id);
      setPhase("done");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Scoring failed. You can skip this step.");
      setPhase("chat");
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !view || streaming != null) return;
    setError(null);
    setDraft("");
    const userKey = `u${Date.now()}`;
    setMessages((m) => [...m, { key: userKey, role: "user", content }]);
    setStreaming("");
    let ended = false;
    let failed = false;
    try {
      for await (const ev of api.simulations.send(view.attempt.id, content)) {
        if (ev.type === "delta") setStreaming((s) => (s ?? "") + ev.text);
        else if (ev.type === "persona_message") {
          setMessages((m) => [...m, { key: `m${ev.turn}`, role: "persona", content: ev.content }]);
          setStreaming(null);
        } else if (ev.type === "signals") ended = ev.ended;
        else if (ev.type === "error") {
          failed = true;
          setError(ev.message || "The reply failed. Please resend.");
        }
      }
    } catch (err) {
      failed = true;
      setError(err instanceof ApiError ? err.message : "The reply failed. Please resend.");
    }
    setStreaming(null);
    if (failed) {
      setMessages((m) => m.filter((x) => x.key !== userKey));
      setDraft(content);
      return;
    }
    const used = turnsUsed + 1;
    setTurnsUsed(used);
    if (ended || used >= maxTurns) await finish(view.attempt.id);
    else inputRef.current?.focus();
  }

  function skip() {
    if (view && phase === "chat") api.simulations.abandon(view.attempt.id).catch(() => {});
    onSkip();
  }

  const persona = view?.persona;

  return (
    <div className="flex flex-col gap-4">
      {phase === "intro" || phase === "starting" ? (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
          <Eyebrow>Mini-simulation · {maxTurns} turns</Eyebrow>
          <p className="m-0 text-ink-2">
            A short, live conversation with an AI client who has a problem with your work. You&apos;ll have {maxTurns} replies to handle it. How you
            do sets your starting scores for the competencies it exercises.
          </p>
          {error && (
            <p role="alert" className="m-0 flex items-center gap-1.5 text-sm text-danger">
              <CircleAlert size={16} aria-hidden /> {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={start} disabled={!scenarioId || phase === "starting"}>
              {phase === "starting" ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Play size={16} aria-hidden />}
              {phase === "starting" ? "Connecting…" : "Start the conversation"}
            </Button>
            <Button variant="ghost" onClick={skip}>
              Skip this step
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
          {persona && (
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <PersonaAvatar id={persona.id} name={persona.name} size={36} />
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="text-sm font-semibold">{persona.name}</span>
                <span className="truncate text-xs text-muted">
                  {persona.title}, {persona.company}
                </span>
              </div>
              <span className="tabular text-xs text-muted">
                Turn {Math.min(turnsUsed + (phase === "chat" ? 1 : 0), maxTurns)} of {maxTurns}
              </span>
            </div>
          )}
          {view && (
            <p className="m-0 border-b border-divider bg-subtle px-4 py-2.5 text-[13px] text-ink-2">
              <b className="font-semibold">Situation:</b> {view.scenario.briefing.situation}
            </p>
          )}
          <div ref={logRef} role="log" aria-live="polite" aria-label="Conversation" className="flex max-h-[380px] min-h-[220px] flex-col gap-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <Bubble key={m.key} role={m.role} name={m.role === "persona" ? persona?.name : "You"}>
                {m.content}
              </Bubble>
            ))}
            {streaming != null && (
              <Bubble role="persona" name={persona?.name}>
                {streaming || <span className="text-muted">…</span>}
              </Bubble>
            )}
          </div>
          {phase === "chat" && (
            <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-3">
              <label htmlFor="sim-input" className="sr-only">
                Your reply
              </label>
              <textarea
                id="sim-input"
                ref={inputRef}
                rows={2}
                value={draft}
                disabled={streaming != null}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Type your reply. Enter to send, Shift+Enter for a new line."
                className="min-h-[44px] flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
              />
              <Button type="submit" disabled={!draft.trim() || streaming != null} aria-label="Send reply" className="h-11">
                <Send size={16} aria-hidden />
              </Button>
            </form>
          )}
          {phase === "scoring" && (
            <p role="status" className="m-0 flex items-center gap-2 border-t border-border px-4 py-3 text-sm text-muted">
              <LoaderCircle size={16} className="animate-spin" aria-hidden /> Scoring your conversation… this can take up to a minute.
            </p>
          )}
          {phase === "done" && (
            <p role="status" className="m-0 flex items-center gap-2 border-t border-border bg-success-tint px-4 py-3 text-sm font-medium text-success">
              <CircleCheck size={16} aria-hidden /> Conversation scored. It will count toward your placement.
            </p>
          )}
        </div>
      )}
      {error && phase !== "intro" && phase !== "starting" && (
        <p role="alert" className="m-0 flex items-center gap-1.5 text-sm text-danger">
          <CircleAlert size={16} aria-hidden /> {error}
        </p>
      )}
      {phase !== "intro" && phase !== "starting" && (
        <div className="flex flex-wrap justify-end gap-2">
          {phase !== "done" && (
            <Button variant="ghost" onClick={skip} disabled={phase === "scoring"}>
              Skip this step
            </Button>
          )}
          {phase === "done" && <Button onClick={onFinished}>Continue</Button>}
        </div>
      )}
    </div>
  );
}

function Bubble({ role, name, children }: { role: "user" | "persona"; name?: string; children: React.ReactNode }) {
  const mine = role === "user";
  return (
    <div className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
      <span className="text-xs text-muted">{name}</span>
      <div
        className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          mine ? "rounded-br-sm bg-primary text-on-primary" : "rounded-bl-sm border border-border bg-subtle text-ink"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

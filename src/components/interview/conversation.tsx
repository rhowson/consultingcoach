"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, MessageSquareOff, X } from "lucide-react";
import { PersonaAvatar } from "@/components/ui/avatar";
import { toApiError, type ConversationEntry, type InterviewApi, type PersonaView } from "./client";
import { CandidateBubble, ClientBubble, Composer, TypingDots } from "./chat";

interface Msg {
  key: string;
  role: "candidate" | "client";
  content: string;
}

const FALLBACK: PersonaView = { id: "client", name: "The client", title: "Client", company: "" };

/** Client conversation section: a limited number of replies to the persona. */
export function ConversationPanel({
  api,
  persona: personaIn,
  conversation,
  maxTurns,
  live,
  onPaste,
  onReload,
}: {
  api: InterviewApi;
  persona: PersonaView | null;
  conversation: ConversationEntry[];
  maxTurns: number;
  live: boolean;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onReload: () => void;
}) {
  const persona = personaIn ?? FALLBACK;
  const first = persona.name.split(" ")[0];
  const [messages, setMessages] = useState<Msg[]>(() => conversation.map((m, i) => ({ key: `h-${i}`, role: m.role, content: m.content })));
  const [turnsLeft, setTurnsLeft] = useState(() => Math.max(0, maxTurns - conversation.filter((m) => m.role === "candidate").length));
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Reloaded mid-turn: the client's reply is still on its way.
  const awaitingFromServer = conversation.at(-1)?.role === "candidate";

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, waiting]);

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) inputRef.current?.focus();
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || waiting || !live || turnsLeft <= 0) return;
    const key = `c-${Date.now()}`;
    setMessages((ms) => [...ms, { key, role: "candidate", content: text }]);
    setInput("");
    setWaiting(true);
    setError(null);
    try {
      const r = await api.say(text);
      setMessages((ms) => [...ms, { key: `p-${Date.now()}`, role: "client", content: r.reply }]);
      setTurnsLeft(Math.max(0, r.turnsLeft));
      setAnnounce(`${persona.name}: ${r.reply}`);
    } catch (e) {
      const err = toApiError(e);
      if (err.code === "turn_limit") {
        setMessages((ms) => ms.filter((m) => m.key !== key));
        setTurnsLeft(0);
      } else if (err.code === "awaiting_reply") {
        onReload();
      } else {
        setMessages((ms) => ms.filter((m) => m.key !== key));
        setInput((cur) => (cur.trim() ? `${text}\n${cur}` : text));
        setError(`${err.message} Your reply is back in the box below.`);
      }
    } finally {
      setWaiting(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  const finished = turnsLeft <= 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-none items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:px-6">
        <PersonaAvatar id={persona.id} name={persona.name} size={40} />
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate font-semibold">{persona.name}</span>
          <span className="truncate text-[13px] text-muted">
            {persona.title}
            {persona.company ? `, ${persona.company}` : ""}
          </span>
        </div>
        <span
          className={`tabular flex-none rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            finished ? "bg-hover text-muted" : turnsLeft <= 2 ? "bg-warning-tint text-warning-ink" : "bg-primary-tint text-primary"
          }`}
        >
          {turnsLeft} {turnsLeft === 1 ? "reply" : "replies"} left
        </span>
      </div>

      <div ref={logRef} role="log" aria-label={`Conversation with ${persona.name}`} className="flex min-h-[280px] flex-1 flex-col gap-5 overflow-y-auto px-4 py-6 lg:px-6">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
          {messages.map((m) =>
            m.role === "client" ? (
              <ClientBubble key={m.key} persona={persona}>
                {m.content}
              </ClientBubble>
            ) : (
              <CandidateBubble key={m.key}>{m.content}</CandidateBubble>
            ),
          )}
          {waiting && <TypingDots label={`${first} is typing`} avatar={<PersonaAvatar id={persona.id} name={persona.name} size={36} />} />}
          {awaitingFromServer && !waiting && messages.at(-1)?.role === "candidate" && (
            <div role="status" className="flex flex-wrap items-center gap-3 text-sm text-muted">
              {first} is still replying.
              <button type="button" onClick={onReload} className="h-8 rounded-md border border-border bg-surface px-3 text-[13px] font-medium text-ink hover:bg-hover">
                Check for reply
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>

      <div className="flex-none border-t border-border bg-surface px-4 pt-3 pb-4 lg:px-6">
        <div className="mx-auto flex max-w-[720px] flex-col gap-2">
          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-md bg-danger-tint px-3 py-2.5 text-sm text-danger">
              <CircleAlert size={16} className="mt-0.5 flex-none" aria-hidden />
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="rounded-sm bg-transparent p-0 text-danger">
                <X size={16} aria-hidden />
              </button>
            </div>
          )}
          {finished ? (
            <div role="status" className="flex items-center gap-2.5 rounded-lg border border-border bg-subtle px-4 py-3 text-sm">
              <MessageSquareOff size={16} className="flex-none text-muted" aria-hidden />
              Conversation finished — submit when ready.
            </div>
          ) : (
            <Composer
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSend={() => void send()}
              onPaste={onPaste}
              label={`Your reply to ${first}`}
              placeholder={waiting ? `${first} is typing…` : `Reply to ${first}…`}
              waiting={waiting || (awaitingFromServer && messages.at(-1)?.role === "candidate")}
              disabled={!live}
            />
          )}
          <p className="m-0 hidden text-xs text-muted lg:block">Enter to send · Shift+Enter for a new line.</p>
        </div>
      </div>
    </div>
  );
}

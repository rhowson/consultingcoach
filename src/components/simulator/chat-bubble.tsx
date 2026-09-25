import { PersonaAvatar } from "@/components/ui/avatar";

interface PersonaInfo {
  id: string;
  name: string;
  title: string;
  company: string;
}

/** Thin rule with a centred label: "Session started · David Okafor has joined". */
export function SystemDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-center text-xs text-muted">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function PersonaBubble({ persona, time, children }: { persona: PersonaInfo; time?: string; children: React.ReactNode }) {
  return (
    <div className="flex max-w-[88%] items-start gap-3">
      <PersonaAvatar id={persona.id} name={persona.name} size={36} />
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
          <span className="font-semibold">{persona.name}</span>
          <span className="text-muted">
            {persona.title}, {persona.company}
          </span>
          {time && <span className="tabular text-xs text-muted">{time}</span>}
        </div>
        <div className="rounded-[4px_12px_12px_12px] border border-border bg-surface px-4 py-3 break-words whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  );
}

export function UserBubble({ time, children }: { time?: string; children: React.ReactNode }) {
  return (
    <div className="flex max-w-[80%] flex-col items-end gap-1 self-end">
      <span className="tabular text-xs text-muted">You{time ? ` · ${time}` : ""}</span>
      <div className="rounded-[12px_4px_12px_12px] bg-primary px-4 py-3 break-words whitespace-pre-wrap text-on-primary">{children}</div>
    </div>
  );
}

export function TypingBubble({ persona }: { persona: PersonaInfo }) {
  const first = persona.name.split(" ")[0];
  return (
    <div className="flex items-center gap-3">
      <PersonaAvatar id={persona.id} name={persona.name} size={36} />
      <div role="img" aria-label={`${first} is typing`} className="flex rounded-[4px_12px_12px_12px] border border-border bg-surface px-4 py-3.5">
        <span className="inline-flex h-3 items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="cc-dot h-1.5 w-1.5 rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      </div>
    </div>
  );
}

/**
 * Typed fetch client for the candidate side of the interview assessment.
 * The link token is the credential, so every call is scoped to it.
 */

export type InterviewStatus = "invited" | "in_progress" | "submitted" | "scored" | "revoked";
export type SectionKind = "critical_thinking" | "ai_analysis" | "client_conversation" | "reflection";

export interface PackQuestion {
  id: string;
  prompt: string;
  maxWords: number;
}

export interface PackSection {
  id: string;
  kind: SectionKind;
  title: string;
  durationMin: number;
  instructions: string[];
  aiAssistant: boolean;
  questions: PackQuestion[];
  maxTurns: number | null;
}

export interface CaseExhibit {
  id: string;
  title: string;
  kind: string;
  data: string;
}

export interface CasePackView {
  client: string;
  question: string;
  exhibits: CaseExhibit[];
  interviews: { id: string; who: string; notes: string }[];
  clientEmail: string;
}

export interface PersonaView {
  id: string;
  name: string;
  title: string;
  company: string;
}

export interface SectionStateView {
  sectionId: string;
  startedAt: string;
  deadline: string;
  submittedAt: string | null;
  timedOut: boolean;
  answers: Record<string, string>;
}

export interface AssistantLogEntry {
  role: "candidate" | "assistant";
  content: string;
  /** Present if the server marks guardrail refusals in the log. */
  blocked?: boolean;
}

export interface ConversationEntry {
  role: "candidate" | "client";
  content: string;
}

export interface CandidateView {
  candidateName: string;
  status: InterviewStatus;
  consented: boolean;
  serverNow: string;
  pack: { title: string; summary: string; totalMin: number; sections: PackSection[] };
  casePack: CasePackView | null;
  aiPreRead: string | null;
  persona: PersonaView | null;
  sections: SectionStateView[];
  assistantLog: AssistantLogEntry[];
  assistantPromptsLeft: number;
  conversation: ConversationEntry[];
}

export interface TelemetryEvent {
  type: "paste" | "copy_blocked" | "tab_hidden" | "tab_visible";
  sectionId?: string;
  meta?: { chars?: number; field?: string; awayMs?: number };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const NETWORK_MESSAGE = "We couldn't reach the server. Check your connection and try again.";

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  return new ApiError(0, "network", NETWORK_MESSAGE);
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new ApiError(0, "network", NETWORK_MESSAGE);
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON (e.g. a proxy error page) falls through to the generic error below.
  }
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(res.status, err?.code ?? "error", err?.message ?? "Something went wrong. Please try again.");
  }
  return body as T;
}

export function interviewApi(token: string) {
  const base = `/api/interview/${encodeURIComponent(token)}`;
  const section = (id: string) => `${base}/sections/${encodeURIComponent(id)}`;
  const post = <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

  return {
    view: () => request<CandidateView>(base),
    consent: () => post<CandidateView>(`${base}/consent`),
    start: (sectionId: string) => post<CandidateView>(`${section(sectionId)}/start`),
    save: (sectionId: string, answers: Record<string, string>) =>
      request<{ saved: boolean; savedAt: string }>(section(sectionId), { method: "PUT", body: JSON.stringify({ answers, submit: false }) }),
    submit: (sectionId: string, answers: Record<string, string>) =>
      request<CandidateView>(section(sectionId), { method: "PUT", body: JSON.stringify({ answers, submit: true }) }),
    /** Best-effort autosave while the page is being hidden or closed. */
    saveKeepalive: (sectionId: string, answers: Record<string, string>) => {
      try {
        void fetch(section(sectionId), {
          method: "PUT",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, submit: false }),
        }).catch(() => {});
      } catch {
        // Ignore: the debounced autosave has usually already run.
      }
    },
    ask: (message: string) =>
      post<{ reply: string; blocked: boolean; category: string; promptsLeft: number }>(`${base}/assistant`, { message }),
    say: (message: string) => post<{ reply: string; turnsLeft: number }>(`${base}/conversation`, { message }),
    /** Fire-and-forget. `beacon` uses navigator.sendBeacon so it survives page hide. */
    telemetry: (events: TelemetryEvent[], beacon = false) => {
      if (!events.length) return;
      const payload = JSON.stringify({ events: events.slice(0, 50) });
      if (beacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        try {
          if (navigator.sendBeacon(`${base}/telemetry`, new Blob([payload], { type: "application/json" }))) return;
        } catch {
          // Fall back to fetch below.
        }
      }
      void fetch(`${base}/telemetry`, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: payload }).catch(() => {});
    },
  };
}

export type InterviewApi = ReturnType<typeof interviewApi>;

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const fmtCountdown = (secs: number) => {
  const s = Math.max(0, Math.ceil(secs));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

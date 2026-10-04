/**
 * Typed browser client for the assessor API (/api/assess/**).
 * Response types are inferred from the interview service, so they can't drift.
 */
import type { createInterview, getInterviewReport, listInterviews } from "@/lib/services/interviews";
import type { Level } from "@/lib/competency";
import { ApiError } from "@/lib/client/api";

type R<F extends (...a: never[]) => unknown> = Awaited<ReturnType<F>>;
type Jsonify<T> = T extends Date ? string : T extends (infer U)[] ? Jsonify<U>[] : T extends object ? { [K in keyof T]: Jsonify<T[K]> } : T;

export type InterviewSummary = Jsonify<R<typeof listInterviews>[number]>;
export type InterviewReport = Jsonify<R<typeof getInterviewReport>>;
export type InterviewEvent = InterviewReport["events"][number];
export type CreatedInterview = Jsonify<R<typeof createInterview>>;
export type InterviewStatus = InterviewSummary["status"];
export type Recommendation = NonNullable<InterviewSummary["recommendation"]>;
export interface PackOption {
  id: string;
  title: string;
  summary: string;
  totalMin: number;
}

export { ApiError };

async function request<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(`/api/assess${path}`, {
    ...rest,
    headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
    throw new ApiError(res.status, body?.error?.code ?? "error", body?.error?.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

const id = (v: string) => encodeURIComponent(v);

export const assessApi = {
  list: () => request<{ interviews: InterviewSummary[]; packs: PackOption[] }>("/interviews"),
  create: (body: { candidateName: string; candidateEmail?: string; targetLevel: Level; packId: string }) =>
    request<CreatedInterview>("/interviews", { method: "POST", json: body }),
  get: (interviewId: string) => request<InterviewReport>(`/interviews/${id(interviewId)}`),
  update: (interviewId: string, body: { assessorNotes?: string; revoke?: boolean }) =>
    request<InterviewReport>(`/interviews/${id(interviewId)}`, { method: "PATCH", json: body }),
  remove: (interviewId: string) => request<{ deleted: boolean }>(`/interviews/${id(interviewId)}`, { method: "DELETE" }),
  regenerateLink: (interviewId: string) => request<{ token: string }>(`/interviews/${id(interviewId)}/link`, { method: "POST", json: {} }),
  rescore: (interviewId: string) => request<InterviewReport>(`/interviews/${id(interviewId)}/rescore`, { method: "POST", json: {} }),
};

/** A friendly message for any thrown error. */
export function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

/** The candidate link for a one-time token. */
export function interviewLink(token: string) {
  return `${window.location.origin}/interview/${token}`;
}

/** An invite that was never started and whose link has lapsed. */
export function isExpired(iv: Pick<InterviewSummary, "status" | "expiresAt">, now: number) {
  return iv.status === "invited" && new Date(iv.expiresAt).getTime() < now;
}

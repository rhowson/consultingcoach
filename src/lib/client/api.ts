/**
 * Typed browser client for the Consulting Coach API (see docs/API.md).
 * Response types are inferred from the server services, so they can't drift.
 */
import type { getDashboard, getProgress, publicPersona, publicScenario } from "@/lib/services/progress";
import type { getAttemptView, getReport, useHint, SimEvent } from "@/lib/services/attempts";
import type { getStoryboard } from "@/lib/services/studio";
import type { completeOnboarding } from "@/lib/services/onboarding";
import type { getLesson, listTracks } from "@/lib/services/learn";
import type { getReview } from "@/lib/services/redpen";
import type { User } from "@/lib/auth";
import type { Competency, Level } from "@/lib/competency";
import type { GhostSlide, PyramidNode } from "@/lib/types";
import { readSse } from "./sse";

type R<F extends (...a: never[]) => unknown> = Awaited<ReturnType<F>>;
type Jsonify<T> = T extends Date ? string : T extends (infer U)[] ? Jsonify<U>[] : T extends object ? { [K in keyof T]: Jsonify<T[K]> } : T;

export type PublicUser = Jsonify<Omit<User, "passwordHash">>;
export type Dashboard = Jsonify<R<typeof getDashboard>>;
export type Progress = Jsonify<R<typeof getProgress>>;
export type SimulationView = Jsonify<R<typeof getAttemptView>>;
export type FeedbackReport = Jsonify<R<typeof getReport>>;
export type Storyboard = Jsonify<R<typeof getStoryboard>>;
export type OnboardingResult = Jsonify<R<typeof completeOnboarding>>;
export type Track = Jsonify<R<typeof listTracks>[number]>;
export type Lesson = Jsonify<R<typeof getLesson>>;
export type RedPenReview = Jsonify<R<typeof getReview>>;
export type Scenario = Jsonify<ReturnType<typeof publicScenario>>;
export type Persona = Jsonify<ReturnType<typeof publicPersona>>;
export type { SimEvent };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(`/api${path}`, {
    ...rest,
    headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) throw await toError(res);
  return res.json() as Promise<T>;
}

async function toError(res: Response) {
  const body = (await res.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
  return new ApiError(res.status, body?.error?.code ?? "error", body?.error?.message ?? res.statusText);
}

const post = <T>(path: string, json: unknown = {}) => request<T>(path, { method: "POST", json });
const patch = <T>(path: string, json: unknown) => request<T>(path, { method: "PATCH", json });

export const api = {
  auth: {
    signup: (body: { email: string; password: string; name: string }) => post<{ user: PublicUser }>("/auth/signup", body),
    login: (body: { email: string; password: string }) => post<{ user: PublicUser }>("/auth/login", body),
    logout: () => post<{ ok: true }>("/auth/logout"),
  },
  me: {
    get: () => request<{ user: PublicUser }>("/me"),
    update: (body: Partial<Pick<PublicUser, "name" | "currentLevel" | "targetLevel" | "targetDate" | "weeklyRepGoal" | "coachTone">>) =>
      patch<{ user: PublicUser }>("/me", body),
    delete: () => request<{ deleted: true }>("/me", { method: "DELETE" }),
  },
  onboarding: {
    get: () =>
      request<{ diagnosticScenarioId: string; diagnosticMaxTurns: number; titleQuiz: { id: string; exhibit: string; options: string[] }[] }>(
        "/onboarding",
      ),
    submit: (body: {
      currentLevel: Level;
      targetLevel?: Level;
      goal: "promotion" | "break_in" | "sharpen_skill";
      targetDate?: string;
      selfRatings: Record<Competency, number>;
      quizAnswers: Record<string, number>;
    }) => post<OnboardingResult>("/onboarding", body),
  },
  dashboard: () => request<Dashboard>("/dashboard"),
  progress: () => request<Progress>("/progress"),
  scenarios: {
    list: (filters: { kind?: string; competency?: string; level?: string } = {}) =>
      request<{ scenarios: (Scenario & { bestScore: number | null; attempted: boolean })[] }>(
        `/scenarios?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][])}`,
      ),
    get: (id: string) =>
      request<{
        scenario: SimulationView["scenario"];
        persona: Persona | null;
        rubric: { id: string; name: string; criteria: { id: string; label: string; competency: Competency; description: string }[] } | null;
      }>(`/scenarios/${id}`),
  },
  simulations: {
    start: (body: { scenarioId: string; targetLevel?: Level; retryOf?: string; fromTurn?: number }) => post<SimulationView>("/simulations", body),
    get: (id: string) => request<SimulationView>(`/simulations/${id}`),
    /** Sends a message and yields SSE events as the persona replies. */
    async *send(id: string, content: string): AsyncGenerator<SimEvent> {
      const res = await fetch(`/api/simulations/${id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw await toError(res);
      for await (const { event, data } of readSse<Record<string, unknown>>(res)) {
        yield { type: event, ...data } as SimEvent;
      }
    },
    hint: (id: string) => post<Jsonify<R<typeof useHint>>>(`/simulations/${id}/hint`),
    complete: (id: string) => post<FeedbackReport>(`/simulations/${id}/complete`),
    abandon: (id: string) => post<{ attempt: SimulationView["attempt"] }>(`/simulations/${id}/abandon`),
  },
  feedback: (attemptId: string) => request<FeedbackReport>(`/feedback/${attemptId}`),
  studio: {
    cases: () => request<{ cases: Storyboard["case"][] }>("/studio/cases"),
    open: (scenarioId: string) => post<{ storyboard: Storyboard }>("/studio/storyboards", { scenarioId }),
    get: (id: string) => request<{ storyboard: Storyboard }>(`/studio/storyboards/${id}`),
    save: (id: string, body: { stage?: Storyboard["stage"]; pyramid?: PyramidNode | null; slides?: GhostSlide[] }) =>
      patch<{ storyboard: Storyboard }>(`/studio/storyboards/${id}`, body),
    review: (id: string) => post<{ storyboard: Storyboard }>(`/studio/storyboards/${id}/review`),
    resolveComment: (id: string, commentId: string, resolved: boolean) =>
      patch<{ storyboard: Storyboard }>(`/studio/storyboards/${id}/comments/${commentId}`, { resolved }),
    submit: (id: string) => post<FeedbackReport>(`/studio/storyboards/${id}/submit`),
  },
  learn: {
    tracks: () => request<{ tracks: Track[] }>("/learn/tracks"),
    lesson: (id: string) => request<{ lesson: Lesson }>(`/learn/lessons/${id}`),
    complete: (id: string, quizScore?: number) => post<{ lessonId: string; completed: true }>(`/learn/lessons/${id}/complete`, { quizScore }),
  },
  redPen: {
    list: () => request<{ reviews: Omit<RedPenReview, "content">[] }>("/red-pen"),
    get: (id: string) => request<{ review: RedPenReview }>(`/red-pen/${id}`),
    create: (body: { title: string; content: string; deliverableType: RedPenReview["deliverableType"]; targetLevel: Level }) =>
      post<{ review: RedPenReview }>("/red-pen", body),
    delete: (id: string) => request<{ deleted: true }>(`/red-pen/${id}`, { method: "DELETE" }),
  },
};

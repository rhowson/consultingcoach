"use client";

import { useCallback, useMemo, useState } from "react";
import { interviewApi, toApiError, type ApiError, type CandidateView } from "./client";
import { useTelemetry } from "./hooks";
import { Lobby } from "./lobby";
import { SectionRunner } from "./section-runner";
import { ErrorScreen, FinishedScreen } from "./shell";
import { Welcome } from "./welcome";

/** Candidate side of the timed interview: welcome → (lobby → section) × 4 → finished. */
export function InterviewApp({ token, initial }: { token: string; initial: CandidateView }) {
  const api = useMemo(() => interviewApi(token), [token]);
  const track = useTelemetry(api);
  const [view, setView] = useState<CandidateView>(initial);
  const [fatal, setFatal] = useState<ApiError | null>(null);
  const [reloading, setReloading] = useState(false);

  const reload = useCallback(async () => {
    setReloading(true);
    try {
      setView(await api.view());
      setFatal(null);
    } catch (e) {
      setFatal(toApiError(e));
    } finally {
      setReloading(false);
    }
  }, [api]);

  if (fatal) {
    if (fatal.status === 404) return <ErrorScreen kind="invalid" />;
    if (fatal.status === 410) return <ErrorScreen kind="expired" message={fatal.message} />;
    return <ErrorScreen kind="network" message={fatal.code === "network" ? undefined : fatal.message} onRetry={() => void reload()} retrying={reloading} />;
  }

  if (view.status === "revoked") return <ErrorScreen kind="invalid" />;
  if (view.status === "submitted" || view.status === "scored") return <FinishedScreen name={view.candidateName} title={view.pack.title} />;
  if (!view.consented) return <Welcome view={view} api={api} onView={setView} />;

  const open = view.sections.find((s) => !s.submittedAt);
  if (open) {
    const section = view.pack.sections.find((s) => s.id === open.sectionId);
    if (section) {
      return <SectionRunner key={section.id} view={view} section={section} state={open} api={api} track={track} onView={setView} onReload={reload} />;
    }
  }

  const next = view.pack.sections[view.sections.length];
  if (!next) return <FinishedScreen name={view.candidateName} title={view.pack.title} />;
  return <Lobby key={next.id} view={view} section={next} api={api} onView={setView} />;
}

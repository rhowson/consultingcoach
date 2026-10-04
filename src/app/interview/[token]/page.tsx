import type { Metadata } from "next";
import { HttpError } from "@/lib/api/http";
import { candidateView } from "@/lib/services/interviews";
import { InterviewApp } from "@/components/interview/interview-app";
import { ErrorScreen } from "@/components/interview/shell";
import type { CandidateView } from "@/components/interview/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assessment · Consulting Coach",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  // The token is in the URL: never leak it to other sites.
  referrer: "no-referrer",
};

/** Candidate entry point. The one-time link token is the credential — no account needed. */
export default async function InterviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let view: CandidateView;
  try {
    const raw = await candidateView(token);
    // The service widens chat roles to `string`; narrow them for the typed client.
    view = {
      ...raw,
      assistantLog: raw.assistantLog.map((e) => ({ content: e.content, role: e.role === "candidate" ? "candidate" : "assistant", blocked: e.blocked })),
      conversation: raw.conversation.map((e) => ({ content: e.content, role: e.role === "candidate" ? "candidate" : "client" })),
    };
  } catch (err) {
    if (err instanceof HttpError) {
      if (err.status === 404) return <ErrorScreen kind="invalid" />;
      if (err.status === 410) return <ErrorScreen kind="expired" message={err.message} />;
      return <ErrorScreen kind="unavailable" message={err.message} />;
    }
    console.error("Interview page failed to load", err);
    return <ErrorScreen kind="network" message="Something went wrong loading your exercise. Please try again in a moment — your progress is saved." />;
  }
  return <InterviewApp token={token} initial={view} />;
}

import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/page-auth";
import { isAssessorEmail } from "@/lib/env";
import { HttpError } from "@/lib/api/http";
import { getInterviewReport } from "@/lib/services/interviews";
import { getPack } from "@/content/assessment";
import { ReportView } from "@/components/assess/report-view";
import { NoAssessAccess } from "@/components/assess/no-access";
import type { InterviewReport } from "@/components/assess/client";

export const metadata = { title: "Candidate report · Consulting Coach" };
export const dynamic = "force-dynamic";

/** Dates become ISO strings, matching what the API returns to the browser. */
const toJson = <T,>(v: unknown) => JSON.parse(JSON.stringify(v)) as T;
const requestTime = () => Date.now();

async function loadReport(id: string) {
  try {
    return toJson<InterviewReport>(await getInterviewReport(id));
  } catch (err) {
    if (err instanceof HttpError && err.code === "not_found") notFound();
    throw err;
  }
}

export default async function InterviewReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser({ allowAssessor: true });
  if (!isAssessorEmail(user.email)) return <NoAssessAccess />;

  const report = await loadReport((await params).id);
  const clientName = getPack(report.pack.id)?.persona.name ?? "Client";
  return <ReportView key={report.interview.id} initial={report} clientName={clientName} now={requestTime()} />;
}

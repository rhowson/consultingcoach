import { requirePageUser } from "@/lib/page-auth";
import { isAssessorEmail } from "@/lib/env";
import { listInterviews } from "@/lib/services/interviews";
import { assessmentPacks } from "@/content/assessment";
import { AssessmentsHome } from "@/components/assess/assessments-home";
import { NoAssessAccess } from "@/components/assess/no-access";
import type { InterviewSummary } from "@/components/assess/client";

export const metadata = { title: "Interview assessments · Consulting Coach" };
export const dynamic = "force-dynamic";

/** Dates become ISO strings, matching what the API returns to the browser. */
const toJson = <T,>(v: unknown) => JSON.parse(JSON.stringify(v)) as T;
const requestTime = () => Date.now();

export default async function AssessPage() {
  const user = await requirePageUser({ allowAssessor: true });
  if (!isAssessorEmail(user.email)) return <NoAssessAccess />;

  const interviews = toJson<InterviewSummary[]>(await listInterviews());
  const packs = assessmentPacks.map((p) => ({ id: p.id, title: p.title, summary: p.summary, totalMin: p.totalMin }));
  return <AssessmentsHome initialInterviews={interviews} packs={packs} now={requestTime()} />;
}

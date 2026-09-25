import { notFound, redirect } from "next/navigation";
import { HttpError } from "@/lib/api/http";
import { requirePageUser } from "@/lib/page-auth";
import { openStoryboard } from "@/lib/services/studio";

/** Opens (or resumes) the user's draft for a case, then sends them to the editor. */
export default async function NewStoryboardPage({ searchParams }: { searchParams: Promise<{ case?: string | string[] }> }) {
  const user = await requirePageUser();
  const { case: raw } = await searchParams;
  const caseId = Array.isArray(raw) ? raw[0] : raw;
  if (!caseId) redirect("/studio");

  let id: string;
  try {
    id = (await openStoryboard(user, caseId)).id;
  } catch (err) {
    if (err instanceof HttpError && err.code === "not_found") notFound();
    throw err;
  }
  redirect(`/studio/${id}`);
}

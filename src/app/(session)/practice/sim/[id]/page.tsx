import { notFound, redirect } from "next/navigation";
import { requirePageUser } from "@/lib/page-auth";
import { getAttemptView } from "@/lib/services/attempts";
import { HttpError } from "@/lib/api/http";
import type { SimulationView } from "@/lib/client/api";
import { SimulatorSession } from "@/components/simulator/simulator-session";

export const metadata = { title: "Client Simulator · Consulting Coach" };

export default async function SimulatorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;

  let view;
  try {
    view = await getAttemptView(user, id);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }
  if (view.attempt.status === "completed") redirect(`/feedback/${id}`);
  if (view.attempt.mode !== "simulation") redirect("/practice");
  // An abandoned rep can't be resumed; reopen the scenario's briefing so they can start fresh.
  if (view.attempt.status === "abandoned") redirect(`/practice?start=${view.scenario.id}`);

  // Serialise Dates the same way the JSON API would, so the client sees one shape.
  const initial = JSON.parse(JSON.stringify(view)) as SimulationView;
  return <SimulatorSession initial={initial} />;
}

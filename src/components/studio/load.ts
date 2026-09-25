import "server-only";
import { notFound } from "next/navigation";
import { HttpError } from "@/lib/api/http";
import type { Storyboard } from "@/lib/client/api";
import { requirePageUser } from "@/lib/page-auth";
import { getStoryboard } from "@/lib/services/studio";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loads the signed-in user's storyboard for a server page, or renders the 404. */
export async function loadStoryboard(id: string): Promise<Storyboard> {
  const user = await requirePageUser();
  if (!UUID.test(id)) notFound();
  try {
    // Round-trip through JSON so the client receives exactly the API shape (dates as strings).
    return JSON.parse(JSON.stringify(await getStoryboard(user, id))) as Storyboard;
  } catch (err) {
    if (err instanceof HttpError && err.code === "not_found") notFound();
    throw err;
  }
}

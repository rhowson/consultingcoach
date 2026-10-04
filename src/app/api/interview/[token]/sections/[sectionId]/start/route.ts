import { json, route } from "@/lib/api/http";
import { startSection } from "@/lib/services/interviews";

type Ctx = { params: Promise<{ token: string; sectionId: string }> };

/** Starts the section's server-side clock. */
export const POST = route<Ctx>(async (_req, { params }) => {
  const { token, sectionId } = await params;
  return json(await startSection(token, sectionId));
});

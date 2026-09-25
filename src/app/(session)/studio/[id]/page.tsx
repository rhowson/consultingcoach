import type { Metadata } from "next";
import { loadStoryboard } from "@/components/studio/load";
import { StudioEditor, SubmittedStoryboard } from "@/components/studio/studio-editor";

export const metadata: Metadata = { title: "Storyboard Studio · Consulting Coach" };

export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await loadStoryboard(id);
  return sb.attemptId ? <SubmittedStoryboard storyboard={sb} /> : <StudioEditor key={sb.id} storyboard={sb} />;
}

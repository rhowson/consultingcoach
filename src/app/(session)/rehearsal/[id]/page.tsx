import type { Metadata } from "next";
import { PanelsTopLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { loadStoryboard } from "@/components/studio/load";
import { Rehearsal } from "@/components/rehearsal/rehearsal";
import { buildDeck } from "@/components/rehearsal/script";

export const metadata: Metadata = { title: "SteerCo Rehearsal · Consulting Coach" };

/** `[id]` is a storyboard id: rehearse its ghost deck in front of a scripted committee. */
export default async function RehearsalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await loadStoryboard(id);
  const pack = sb.case.casePack!;
  const deck = buildDeck(sb.pyramid, sb.slides, pack.exhibits);

  if (deck.length === 0) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg p-6">
        <div className="flex max-w-[440px] flex-col items-center gap-4 text-center">
          <PanelsTopLeft size={28} className="text-faint" aria-hidden />
          <h1 className="m-0 font-serif text-2xl font-semibold">Nothing to present yet</h1>
          <p className="m-0 text-sm text-muted">Write a governing thought and build a ghost deck in the Studio, then come back to rehearse it.</p>
          <ButtonLink href={`/studio/${sb.id}`}>Open the Studio</ButtonLink>
        </div>
      </main>
    );
  }

  return (
    <Rehearsal
      storyboardId={sb.id}
      title={`${pack.client} SteerCo`}
      client={pack.client}
      targetLevel={sb.case.targetLevel}
      deck={deck}
    />
  );
}

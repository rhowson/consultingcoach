import Link from "next/link";
import { FileText } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type HubStoryboard = {
  id: string;
  title: string;
  /** Set once submitted; the storyboard is read-only from then on. */
  attemptId: string | null;
  /** Ready-to-show status line, e.g. "Draft · Pyramid · Updated 4 Oct". */
  status: string;
};

/** Compact list of the user's storyboards: one action per row. */
export function StorylineList({ storyboards }: { storyboards: HubStoryboard[] }) {
  return (
    <section aria-labelledby="mine-title" className="flex flex-col gap-3">
      <h2 id="mine-title" className="eyebrow m-0">
        Your storylines
      </h2>
      <Card className="overflow-hidden">
        <ul className="m-0 list-none p-0">
          {storyboards.map((b, i) => (
            <li key={b.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 ${i ? "border-t border-divider" : ""}`}>
              <FileText size={18} className="flex-none text-muted" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col leading-snug">
                <Link href={`/studio/${b.id}`} className="truncate text-sm font-semibold text-ink no-underline hover:text-primary hover:underline">
                  {b.title}
                </Link>
                <span className="text-[13px] text-muted">{b.status}</span>
              </div>
              {b.attemptId ? (
                <ButtonLink href={`/feedback/${b.attemptId}`} variant="secondary" size="sm">
                  View feedback<span className="sr-only">: {b.title}</span>
                </ButtonLink>
              ) : (
                <ButtonLink href={`/studio/${b.id}`} variant="secondary" size="sm">
                  Continue<span className="sr-only">: {b.title}</span>
                </ButtonLink>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

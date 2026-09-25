import Link from "next/link";
import { ChevronRight, PenLine } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { listReviews } from "@/lib/services/redpen";
import { targetLevelFor } from "@/lib/services/progress";
import { Card, CardTitle } from "@/components/ui/card";
import { LevelBadge, VerdictChip } from "@/components/ui/badges";
import { RedPenForm } from "@/components/red-pen/red-pen-form";
import { DELIVERABLE_LABEL } from "@/components/red-pen/meta";

export const metadata = { title: "Red Pen · Consulting Coach" };

export default async function RedPenPage() {
  const user = await requirePageUser();
  const reviews = await listReviews(user);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card aria-labelledby="new-title" className="flex flex-col gap-5 p-6 lg:col-span-8">
        <div className="flex flex-col gap-1">
          <CardTitle id="new-title">Get a partner&apos;s red pen</CardTitle>
          <p className="m-0 text-sm text-ink-2">
            Paste a real deliverable and get it marked up the way a partner would before it goes to the client.
          </p>
        </div>
        <RedPenForm defaultLevel={targetLevelFor(user)} />
      </Card>

      <Card aria-labelledby="past-title" className="flex flex-col gap-2 self-start p-6 lg:col-span-4">
        <CardTitle id="past-title" className="mb-2">
          Past reviews
        </CardTitle>
        {reviews.length === 0 && (
          <p className="m-0 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted">
            <PenLine size={16} aria-hidden /> No reviews yet. Your marked-up drafts appear here.
          </p>
        )}
        <ul className="m-0 flex list-none flex-col p-0">
          {reviews.map((r) => (
            <li key={r.id}>
              <Link href={`/red-pen/${r.id}`} className="flex items-center gap-3 border-t border-border py-3.5 text-ink no-underline hover:bg-subtle">
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="truncate text-[15px] font-semibold">{r.title}</span>
                  <span className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                    {r.result && <VerdictChip verdict={r.result.verdict} />}
                    <LevelBadge level={r.targetLevel} />
                    <span>
                      {DELIVERABLE_LABEL[r.deliverableType]} · {r.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                </span>
                <ChevronRight size={16} className="flex-none text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

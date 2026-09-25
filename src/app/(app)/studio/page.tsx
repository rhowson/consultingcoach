import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, Clock, FileText, Presentation } from "lucide-react";
import { db, schema } from "@/db";
import { requirePageUser } from "@/lib/page-auth";
import { listCases } from "@/lib/services/studio";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CompetencyChip, DifficultyDots, LevelBadge } from "@/components/ui/badges";
import { STAGES } from "@/components/studio/model";

export default async function StudioLandingPage() {
  const user = await requirePageUser();
  const [cases, boards] = await Promise.all([
    listCases(),
    db.query.storyboards.findMany({
      where: eq(schema.storyboards.userId, user.id),
      orderBy: desc(schema.storyboards.updatedAt),
      columns: { id: true, scenarioId: true, stage: true, attemptId: true, updatedAt: true, slides: true },
    }),
  ]);
  const titleById = new Map(cases.map((c) => [c.id, c.title]));
  const draftFor = new Set(boards.filter((b) => !b.attemptId).map((b) => b.scenarioId));
  const date = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div className="flex flex-col gap-8">
      <p className="m-0 max-w-[640px] text-ink-2">
        Turn a case pack into a governing thought, a pyramid and a ghost deck the CEO could follow from the titles alone. Then rehearse it in
        front of the SteerCo.
      </p>

      <section aria-labelledby="cases-title" className="flex flex-col gap-4">
        <h2 id="cases-title" className="eyebrow m-0">
          Cases
        </h2>
        {cases.length === 0 ? (
          <Card className="p-6 text-sm text-muted">No storyboard cases are available yet.</Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cases.map((c) => (
              <Card key={c.id} aria-labelledby={`case-${c.id}`} className="flex flex-col gap-4 p-6">
                <Eyebrow className="flex items-center gap-2">
                  <Presentation size={14} aria-hidden />
                  Storyboard case
                </Eyebrow>
                <div className="flex flex-col gap-1.5">
                  <CardTitle id={`case-${c.id}`} className="leading-snug">
                    {c.title}
                  </CardTitle>
                  <p className="m-0 text-sm text-ink-2">{c.summary}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.competencies.map((k) => (
                    <CompetencyChip key={k} competency={k} />
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-divider pt-4 text-[13px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} aria-hidden />
                    {c.durationMin} min
                  </span>
                  <DifficultyDots value={c.difficulty} />
                  <LevelBadge level={c.targetLevel} />
                  <ButtonLink href={`/studio/new?case=${encodeURIComponent(c.id)}`} className="ml-auto" aria-label={`${draftFor.has(c.id) ? "Continue draft" : "Open case"}: ${c.title}`}>
                    {draftFor.has(c.id) ? "Continue draft" : "Open case"}
                    <ArrowRight size={16} aria-hidden />
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {boards.length > 0 && (
        <section aria-labelledby="mine-title" className="flex flex-col gap-4">
          <h2 id="mine-title" className="eyebrow m-0">
            Your storyboards
          </h2>
          <Card className="overflow-hidden">
            <ul className="m-0 list-none p-0">
              {boards.map((b, i) => {
                const stage = STAGES.find((s) => s.key === b.stage)?.label ?? b.stage;
                return (
                  <li key={b.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 ${i ? "border-t border-divider" : ""}`}>
                    <FileText size={18} className="flex-none text-muted" aria-hidden />
                    <div className="flex min-w-0 flex-1 flex-col leading-snug">
                      <Link href={`/studio/${b.id}`} className="truncate text-sm font-semibold text-ink hover:text-primary hover:underline">
                        {titleById.get(b.scenarioId) ?? b.scenarioId}
                      </Link>
                      <span className="text-[13px] text-muted">
                        {b.attemptId ? "Submitted" : `Draft · ${stage}`} · {b.slides.length} slide{b.slides.length === 1 ? "" : "s"} · Updated {date(b.updatedAt)}
                      </span>
                    </div>
                    {b.attemptId ? (
                      <span className="flex items-center gap-2">
                        {b.slides.length > 0 && (
                          <ButtonLink href={`/rehearsal/${b.id}`} variant="ghost" size="sm">
                            Rehearse
                          </ButtonLink>
                        )}
                        <ButtonLink href={`/feedback/${b.attemptId}`} variant="secondary" size="sm">
                          View feedback
                        </ButtonLink>
                      </span>
                    ) : (
                      <ButtonLink href={`/studio/${b.id}`} variant="secondary" size="sm">
                        Continue
                      </ButtonLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}

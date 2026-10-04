"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, CircleAlert, ClipboardList, Plus } from "lucide-react";
import { LEVELS, LEVEL_LABELS, type Level } from "@/lib/competency";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/badges";
import { assessApi, errorMessage, interviewLink, type InterviewSummary, type PackOption } from "./client";
import { LinkPanel } from "./link-panel";
import { RecommendationChip, STATUS_FILTERS, StatusChip, displayStatus, fmtDate } from "./meta";

const field =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary aria-[invalid=true]:border-danger";

type Filter = (typeof STATUS_FILTERS)[number]["value"];

export function AssessmentsHome({ initialInterviews, packs, now }: { initialInterviews: InterviewSummary[]; packs: PackOption[]; now: number }) {
  const [interviews, setInterviews] = useState(initialInterviews);
  const [created, setCreated] = useState<{ link: string; name: string } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () =>
      interviews
        .map((iv) => ({ iv, status: displayStatus(iv, now) }))
        .filter(({ status }) => filter === "all" || status === filter || (filter === "submitted" && status === "scoring_failed"))
        .sort((a, b) => b.iv.createdAt.localeCompare(a.iv.createdAt)),
    [interviews, filter, now],
  );
  const packTitle = (id: string) => packs.find((p) => p.id === id)?.title ?? id;

  return (
    <div className="flex w-full max-w-[1100px] flex-col gap-6">
      <NewInterviewCard
        packs={packs}
        onCreated={(iv, token) => {
          setInterviews((list) => [iv, ...list]);
          setCreated({ link: interviewLink(token), name: iv.candidateName });
          setFilter("all");
        }}
      />
      {created && <LinkPanel link={created.link} candidateName={created.name} onDismiss={() => setCreated(null)} />}

      <section aria-labelledby="iv-list-title" className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle id="iv-list-title">Interviews</CardTitle>
          {interviews.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="iv-filter" className="text-sm text-muted">
                Status
              </label>
              <select id="iv-filter" className={`${field} h-9 w-auto`} value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {interviews.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <ClipboardList size={28} className="text-faint" aria-hidden />
            <div className="flex flex-col gap-1">
              <span className="font-serif text-lg font-semibold">No interviews yet</span>
              <p className="m-0 max-w-[420px] text-sm text-muted">
                Create an interview above to get a one-time link for your candidate. Their report appears here once they finish.
              </p>
            </div>
          </Card>
        ) : rows.length === 0 ? (
          <Card className="px-6 py-10 text-center text-sm text-muted">
            No interviews with this status.{" "}
            <button type="button" className="font-semibold text-primary underline-offset-2 hover:underline" onClick={() => setFilter("all")}>
              Show all
            </button>
          </Card>
        ) : (
          <>
            {/* Wide screens: table */}
            <Card className="hidden overflow-hidden md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Candidate
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Level
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">
                      Score
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Recommendation
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Dates
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      <span className="sr-only">Report</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ iv, status }) => (
                    <tr key={iv.id} className="border-b border-divider last:border-b-0 hover:bg-hover">
                      <td className="px-4 py-3 align-top">
                        <div className="flex min-w-0 flex-col">
                          <span className="font-semibold text-ink">{iv.candidateName}</span>
                          {iv.candidateEmail && <span className="truncate text-xs text-muted">{iv.candidateEmail}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <LevelBadge level={iv.targetLevel} />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <StatusChip status={status} />
                      </td>
                      <td className="tabular px-3 py-3 text-right align-top font-semibold">
                        {iv.overallScore != null ? (
                          <>
                            {iv.overallScore.toFixed(1)}
                            <span className="text-xs font-normal text-muted"> / 5</span>
                          </>
                        ) : (
                          <span className="font-normal text-faint">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        {iv.recommendation ? <RecommendationChip recommendation={iv.recommendation} /> : <span className="text-faint">—</span>}
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-muted">
                        <DateLines iv={iv} />
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <Link
                          href={`/assess/${iv.id}`}
                          className="inline-flex items-center gap-0.5 text-[13px] font-semibold whitespace-nowrap text-primary hover:underline"
                        >
                          Report
                          <ChevronRight size={14} aria-hidden />
                          <span className="sr-only"> for {iv.candidateName}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Narrow screens: cards */}
            <ul className="m-0 flex list-none flex-col gap-3 p-0 md:hidden">
              {rows.map(({ iv, status }) => (
                <li key={iv.id}>
                  <Link
                    href={`/assess/${iv.id}`}
                    className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4 hover:bg-hover"
                    aria-label={`${iv.candidateName}: open report`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="font-semibold text-ink">{iv.candidateName}</span>
                        <span className="truncate text-xs text-muted">{packTitle(iv.packId)}</span>
                      </div>
                      {iv.overallScore != null && (
                        <span className="tabular flex-none text-lg font-semibold">
                          {iv.overallScore.toFixed(1)}
                          <span className="text-xs font-normal text-muted"> / 5</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <LevelBadge level={iv.targetLevel} />
                      <StatusChip status={status} />
                      {iv.recommendation && <RecommendationChip recommendation={iv.recommendation} />}
                    </div>
                    <div className="text-xs text-muted">
                      <DateLines iv={iv} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function DateLines({ iv }: { iv: InterviewSummary }) {
  return (
    <span className="flex flex-col gap-0.5 whitespace-nowrap">
      <span>Invited {fmtDate(iv.createdAt)}</span>
      {iv.submittedAt ? (
        <span>Submitted {fmtDate(iv.submittedAt)}</span>
      ) : iv.startedAt ? (
        <span>Started {fmtDate(iv.startedAt)}</span>
      ) : iv.status === "invited" ? (
        <span>Link expires {fmtDate(iv.expiresAt)}</span>
      ) : null}
    </span>
  );
}

function NewInterviewCard({ packs, onCreated }: { packs: PackOption[]; onCreated: (iv: InterviewSummary, token: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<Level>("consultant");
  const [packId, setPackId] = useState(packs[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameValid = name.trim().length > 0;
  const emailValid = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const pack = packs.find((p) => p.id === packId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!nameValid || !emailValid || !packId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await assessApi.create({ candidateName: name.trim(), candidateEmail: email.trim() || undefined, targetLevel: level, packId });
      onCreated(res.interview, res.token);
      setName("");
      setEmail("");
      setTouched(false);
    } catch (err) {
      setError(errorMessage(err, "Couldn't create the interview. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card aria-labelledby="new-iv-title" className="flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-col gap-0.5">
        <CardTitle id="new-iv-title">New interview</CardTitle>
        <span className="text-sm text-muted">Invite a candidate to a timed exercise. You&apos;ll get a one-time link to send them.</span>
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="iv-name" className="text-sm font-medium">
              Candidate name
            </label>
            <input
              id="iv-name"
              className={field}
              value={name}
              maxLength={120}
              autoComplete="off"
              aria-invalid={touched && !nameValid}
              aria-describedby={touched && !nameValid ? "iv-name-err" : undefined}
              onChange={(e) => setName(e.target.value)}
            />
            {touched && !nameValid && (
              <span id="iv-name-err" className="text-[13px] text-danger">
                Enter the candidate&apos;s name.
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="iv-email" className="text-sm font-medium">
              Email <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="iv-email"
              type="email"
              className={field}
              value={email}
              maxLength={200}
              autoComplete="off"
              aria-invalid={touched && !emailValid}
              aria-describedby={touched && !emailValid ? "iv-email-err" : undefined}
              onChange={(e) => setEmail(e.target.value)}
            />
            {touched && !emailValid && (
              <span id="iv-email-err" className="text-[13px] text-danger">
                Enter a valid email address, or leave it blank.
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="iv-level" className="text-sm font-medium">
              Target level
            </label>
            <select id="iv-level" className={field} value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="iv-pack" className="text-sm font-medium">
              Exercise
            </label>
            <select id="iv-pack" className={field} value={packId} onChange={(e) => setPackId(e.target.value)}>
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        {pack && (
          <p className="m-0 text-[13px] text-muted">
            <span className="tabular font-semibold text-ink-2">{pack.totalMin} minutes.</span> {pack.summary}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy} aria-busy={busy}>
            <Plus size={16} aria-hidden />
            {busy ? "Creating…" : "Create interview"}
          </Button>
          {error && (
            <span role="alert" className="flex items-center gap-1.5 text-sm text-danger">
              <CircleAlert size={16} aria-hidden /> {error}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

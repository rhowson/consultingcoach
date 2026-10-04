import { Ban, CalendarX, CircleAlert, CircleCheck, CircleCheckBig, CircleMinus, CircleX, Hourglass, Mail, Timer, type LucideIcon } from "lucide-react";
import type { InterviewStatus, Recommendation } from "./client";

export type DisplayStatus = InterviewStatus | "expired" | "scoring_failed";

export const STATUS_META: Record<DisplayStatus, { label: string; cls: string; Icon: LucideIcon }> = {
  invited: { label: "Invited", cls: "bg-primary-tint text-primary", Icon: Mail },
  in_progress: { label: "In progress", cls: "bg-accent-tint text-accent-ink", Icon: Timer },
  submitted: { label: "Submitted — scoring…", cls: "bg-hover text-ink-2", Icon: Hourglass },
  scoring_failed: { label: "Submitted — scoring failed", cls: "bg-danger-tint text-danger", Icon: CircleAlert },
  scored: { label: "Scored", cls: "bg-success-tint text-success", Icon: CircleCheck },
  revoked: { label: "Revoked", cls: "bg-hover text-muted", Icon: Ban },
  expired: { label: "Expired", cls: "bg-hover text-muted", Icon: CalendarX },
};

/** Filter options for the list (scoring failures sit under "Submitted"). */
export const STATUS_FILTERS: { value: "all" | Exclude<DisplayStatus, "scoring_failed">; label: string }[] = [
  { value: "all", label: "All" },
  { value: "invited", label: "Invited" },
  { value: "in_progress", label: "In progress" },
  { value: "submitted", label: "Submitted" },
  { value: "scored", label: "Scored" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

export function displayStatus(iv: { status: InterviewStatus; expiresAt: string; scoringError: string | null }, now: number): DisplayStatus {
  if (iv.status === "invited" && new Date(iv.expiresAt).getTime() < now) return "expired";
  if (iv.status === "submitted" && iv.scoringError) return "scoring_failed";
  return iv.status;
}

export function StatusChip({ status }: { status: DisplayStatus }) {
  const s = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full py-px pr-2 pl-1.5 text-xs font-semibold whitespace-nowrap ${s.cls}`}>
      <s.Icon size={13} strokeWidth={2} aria-hidden />
      {s.label}
    </span>
  );
}

export const RECOMMENDATION_META: Record<Recommendation, { label: string; cls: string; Icon: LucideIcon }> = {
  strong_yes: { label: "Strong yes", cls: "border-success bg-success-tint text-success", Icon: CircleCheckBig },
  yes: { label: "Yes", cls: "border-transparent bg-success-tint text-success", Icon: CircleCheck },
  lean_no: { label: "Lean no", cls: "border-transparent bg-warning-tint text-warning-ink", Icon: CircleMinus },
  no: { label: "No", cls: "border-transparent bg-danger-tint text-danger", Icon: CircleX },
};

export function RecommendationChip({ recommendation, size = "sm" }: { recommendation: Recommendation; size?: "sm" | "lg" }) {
  const r = RECOMMENDATION_META[recommendation];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap ${r.cls} ${
        size === "lg" ? "py-0.5 pr-3 pl-2 text-sm" : "py-px pr-2 pl-1.5 text-xs"
      }`}
    >
      <r.Icon size={size === "lg" ? 16 : 13} strokeWidth={2} aria-hidden />
      {r.label}
    </span>
  );
}

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/London" });

export const fmtDate = (iso: string | null | undefined) => (iso ? DATE.format(new Date(iso)) : "—");
export const fmtDateTime = (iso: string | null | undefined) => (iso ? DATE_TIME.format(new Date(iso)) : "—");
export const fmtTime = (iso: string) => TIME.format(new Date(iso));

/** Minutes (one decimal) between a section's start and its close. */
export function minutesBetween(from: string, to: string) {
  return Math.round(((new Date(to).getTime() - new Date(from).getTime()) / 60_000) * 10) / 10;
}

export const GUARD_CATEGORY_LABELS: Record<string, string> = {
  write_final_answer: "Asked it to write the answer",
  off_topic: "Off topic",
  other_section: "Outside the memo section",
  assessment_gaming: "About the assessment",
  prompt_injection: "Tried to change its instructions",
};

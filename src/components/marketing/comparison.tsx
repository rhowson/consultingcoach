import { Check, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { CONTAINER, LIFT, SectionHeading } from "./primitives";

const ROWS = [
  { label: "Time to first real practice", old: "Wait for a live engagement", next: "Today, in 10 minutes" },
  { label: "Feedback", old: "Annual review, vague", next: "Every rep, specific" },
  { label: "Difficult conversations", old: "Learned on the client", next: "Rehearsed safely first" },
  { label: "Standard", old: "Depends on your manager", next: "Calibrated to your target level" },
  { label: "Storylining", old: "Red pen at midnight", next: "Structured coaching before the deadline" },
];

export function Comparison() {
  return (
    <section aria-labelledby="difference-title" className="pb-20 sm:pb-28">
      <div className={CONTAINER}>
        <div className="sky relative overflow-hidden rounded-2xl px-4 py-14 shadow-lg sm:px-10 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-[rgba(10,40,80,0.2)] to-transparent" />
          <div className="relative">
            <SectionHeading id="difference-title" tone="sky" eyebrow="The difference" first="Old way vs." second="the Consulting Coach way" />

            <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
              <div className={`rounded-2xl bg-surface p-5 shadow-md sm:p-7 ${LIFT}`}>
                <h3 className="m-0 flex items-center gap-2.5 font-display text-lg font-semibold text-ink-2">
                  <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-md bg-hover text-muted">
                    <X size={17} />
                  </span>
                  The old way
                </h3>
                <dl className="m-0 mt-5 flex flex-col">
                  {ROWS.map((r) => (
                    <div key={r.label} className="flex flex-col gap-1.5 border-t border-divider py-3.5 first:border-t-0 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                      <dt className="text-[13px] font-medium text-muted">{r.label}</dt>
                      <dd className="m-0 flex items-center gap-2 text-[14.5px] font-medium text-ink-2 lg:text-right">
                        <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger-tint text-danger lg:order-2">
                          <X size={12} strokeWidth={3} />
                        </span>
                        {r.old}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className={`rounded-2xl bg-surface p-5 shadow-lg ring-2 ring-primary/40 sm:p-7 ${LIFT}`}>
                <h3 className="m-0 flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
                  <Logo compact />
                  The Consulting Coach way
                </h3>
                <dl className="m-0 mt-5 flex flex-col">
                  {ROWS.map((r) => (
                    <div key={r.label} className="flex flex-col gap-1.5 border-t border-divider py-3 first:border-t-0 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                      <dt className="text-[13px] font-medium text-muted">{r.label}</dt>
                      <dd className="m-0 lg:text-right">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint py-1 pr-3 pl-1.5 text-[14px] font-semibold text-primary">
                          <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                            <Check size={12} strokeWidth={3} />
                          </span>
                          {r.next}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

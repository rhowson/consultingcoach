import { ArrowUp, Check, Circle, Sparkles } from "lucide-react";

/** Pure-markup mock of the Client Simulator, used as the hero visual. Decorative: the figure caption carries the meaning. */
export function AppPreview() {
  return (
    <figure className="m-0">
      <figcaption className="sr-only">
        Preview of the Client Simulator: Sofia Alvarez, Director of Digital, pushes back on a revised ERP timeline. You reply, and the coach scores
        the turn 4 out of 5 against the Manager bar while the client&apos;s mood warms.
      </figcaption>
      <div aria-hidden className="glass rounded-2xl p-1.5 shadow-lg sm:p-2">
        <div className="overflow-hidden rounded-xl bg-surface text-left ring-1 ring-border">
          {/* Title bar */}
          <div className="flex items-center gap-3 border-b border-border bg-subtle px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
            </div>
            <span className="truncate text-[13px] font-semibold text-ink">Client Simulator</span>
            <span className="hidden truncate rounded-full bg-hover px-2 py-0.5 text-[11px] font-medium text-muted sm:inline">
              ERP cut-over reset · Manager level
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success-tint px-2 py-0.5 text-[11px] font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success motion-safe:animate-pulse" />
              Live
            </span>
          </div>

          <div className="grid md:grid-cols-[minmax(0,1fr)_224px]">
            {/* Conversation */}
            <div className="flex min-w-0 flex-col gap-3.5 p-4 sm:p-5">
              <span className="eyebrow text-[11px]!">Turn 4 of 8</span>

              <div className="flex max-w-[92%] gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-tint text-[12px] font-semibold text-accent-ink">
                  SA
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[12px] text-muted">
                    <span className="font-semibold text-ink">Sofia Alvarez</span> · Director of Digital
                  </span>
                  <p className="m-0 rounded-lg rounded-tl-sm bg-subtle px-3.5 py-2.5 text-[13.5px] leading-snug text-ink ring-1 ring-border">
                    Twelve more weeks? The board signed off a March go-live. Give me one reason not to escalate this to your partner.
                  </p>
                </div>
              </div>

              <div className="flex max-w-[88%] flex-col items-end gap-1 self-end">
                <span className="text-[12px] font-semibold text-ink">You</span>
                <p className="m-0 rounded-lg rounded-tr-sm bg-primary px-3.5 py-2.5 text-[13.5px] leading-snug text-on-primary">
                  Fair challenge. March still works for finance and HR. Payroll is the risk, so let me show you two ways to protect the date your
                  board cares about.
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-md bg-primary-tint px-3 py-2 text-[12.5px] leading-snug text-ink-2">
                <Sparkles size={14} className="mt-px shrink-0 text-primary" />
                <span>
                  <span className="font-semibold text-primary">Coach:</span> acknowledged before reframing. Next, put a number on the payroll risk.
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-1.5 pl-4">
                <span className="flex-1 truncate text-[13px] text-faint">Your reply…</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary">
                  <ArrowUp size={15} />
                </span>
              </div>
            </div>

            {/* Signals */}
            <div className="flex flex-col gap-4 border-t border-border bg-subtle p-4 sm:p-5 md:border-t-0 md:border-l">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow text-[11px]!">Client mood</span>
                    <span className="text-[12px] font-semibold text-success">Warming</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-linear-to-r from-danger via-warning to-success">
                    <span className="absolute top-1/2 left-[64%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-ink shadow-sm" />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted">
                    <span>Sceptical</span>
                    <span>Engaged</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="eyebrow text-[11px]!">Turn score</span>
                  <div className="flex items-baseline gap-2">
                    <span className="tabular font-display text-[28px] leading-none font-semibold text-ink">
                      4<span className="text-[16px] text-muted">/5</span>
                    </span>
                    <span className="rounded-full bg-success-tint px-2 py-0.5 text-[11px] font-semibold text-success">Meets bar</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="eyebrow text-[11px]!">Objectives</span>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[12.5px]">
                  <li className="flex items-center gap-2 text-ink-2">
                    <Check size={14} strokeWidth={2.5} className="text-success" /> Acknowledge the pressure
                  </li>
                  <li className="flex items-center gap-2 text-ink-2">
                    <Check size={14} strokeWidth={2.5} className="text-success" /> Reframe around risk
                  </li>
                  <li className="flex items-center gap-2 text-muted">
                    <Circle size={14} className="text-faint" /> Agree a decision path
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

/** Small SVG progress ring. */
export function ReadinessRing({ percent, size = 44, stroke = 5 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-primary-tint" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - percent / 100)}
        className="stroke-primary"
      />
    </svg>
  );
}

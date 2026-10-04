"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { CONTAINER, LIFT, SectionHeading } from "./primitives";

type Billing = "monthly" | "yearly";

type Tier = {
  name: string;
  blurb: string;
  price: (b: Billing) => { amount: string; unit?: string; note?: string };
  features: string[];
  cta: string;
  popular?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Individual",
    blurb: "Build the habit.",
    price: () => ({ amount: "Free", note: "No card needed" }),
    features: ["3 reps a week", "Learn tracks", "Readiness diagnostic"],
    cta: "Start free",
  },
  {
    name: "Pro",
    blurb: "For your promotion year.",
    price: (b) =>
      b === "yearly" ? { amount: "£15", unit: "/mo", note: "Billed yearly at £180" } : { amount: "£19", unit: "/mo", note: "Billed monthly" },
    features: ["Unlimited reps", "Storyboard Studio", "Partner Red Pen", "SteerCo Rehearsal", "Everything in Individual"],
    cta: "Start free, then upgrade",
    popular: true,
  },
  {
    name: "Teams & assessments",
    blurb: "For practices and recruiting teams.",
    price: () => ({ amount: "Contact us", note: "Tailored to your firm" }),
    features: ["Interview assessments", "Assessor console", "Team reporting", "Everything in Pro for your people"],
    cta: "Talk to us",
  },
];

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <section aria-labelledby="pricing-title" id="pricing" className="scroll-mt-24 py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          id="pricing-title"
          eyebrow="Pricing"
          first="Start free."
          second="Upgrade when it counts."
          lede="Practise every week for free. Go Pro when you're working towards a promotion."
        />

        <div className="mt-10 flex justify-center">
          <div role="group" aria-label="Billing period" className="inline-flex rounded-full border border-border bg-surface p-1 shadow-sm">
            <ToggleButton active={billing === "monthly"} onClick={() => setBilling("monthly")}>
              Monthly
            </ToggleButton>
            <ToggleButton active={billing === "yearly"} onClick={() => setBilling("yearly")}>
              Yearly
              <span
                className={`rounded-full px-1.5 py-px text-[11px] font-semibold ${billing === "yearly" ? "bg-white/25 text-on-primary" : "bg-success-tint text-success"}`}
              >
                −20%
              </span>
            </ToggleButton>
          </div>
        </div>

        <ul className="m-0 mt-12 grid list-none grid-cols-1 items-stretch gap-5 p-0 md:grid-cols-3">
          {TIERS.map((t) => {
            const p = t.price(billing);
            return (
              <li
                key={t.name}
                className={`relative flex flex-col gap-6 rounded-2xl border bg-surface p-6 sm:p-7 ${LIFT} ${
                  t.popular ? "border-primary shadow-lg ring-1 ring-primary" : "border-border shadow-md"
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[12px] font-semibold text-on-primary shadow-sm">
                    Most popular
                  </span>
                )}
                <div className="flex flex-col gap-1">
                  <h3 className="m-0 font-display text-xl font-semibold tracking-tight text-ink">{t.name}</h3>
                  <p className="m-0 text-[14px] text-muted">{t.blurb}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="m-0 flex items-baseline gap-1" aria-live="polite">
                    <span className="tabular font-display text-[40px] leading-none font-semibold tracking-tight text-ink">{p.amount}</span>
                    {p.unit && <span className="text-[15px] font-medium text-muted">{p.unit}</span>}
                  </p>
                  {p.note && <p className="m-0 text-[13px] text-muted">{p.note}</p>}
                </div>
                <ul className="m-0 flex flex-1 list-none flex-col gap-2.5 border-t border-divider p-0 pt-5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14.5px] text-ink-2">
                      <Check size={16} strokeWidth={2.5} aria-hidden className="mt-0.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={buttonClass(t.popular ? "primary" : "secondary", "lg", "group w-full")}>
                  {t.cta}
                  <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 mb-0 text-center text-[13px] text-muted">Illustrative plans. Prices in GBP, excl. VAT.</p>
      </div>
    </section>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors ${
        active ? "bg-primary text-on-primary shadow-sm" : "text-ink-2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

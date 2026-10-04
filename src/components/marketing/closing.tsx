import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { CONTAINER, SKY_PRIMARY } from "./primitives";

export function FinalCta({ primaryHref, primaryLabel, signedIn }: { primaryHref: string; primaryLabel: string; signedIn: boolean }) {
  return (
    <section aria-labelledby="cta-title" className="pb-20 sm:pb-24">
      <div className={CONTAINER}>
        <div className="sky relative overflow-hidden rounded-2xl px-5 py-16 text-center shadow-lg sm:px-10 sm:py-24">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full bg-linear-to-b from-[rgba(10,40,80,0.2)] to-transparent" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 left-1/2 h-48 w-[80%] -translate-x-1/2 rounded-full bg-white/30 blur-3xl" />
          <div className="relative flex flex-col items-center gap-6">
            <h2
              id="cta-title"
              className="m-0 max-w-3xl font-display text-[34px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-white [text-shadow:0_2px_20px_rgba(10,40,80,0.25)] sm:text-5xl"
            >
              Your next promotion starts with one rep
            </h2>
            <p className="m-0 max-w-xl text-[17px] leading-relaxed text-white/95 [text-shadow:0_1px_10px_rgba(10,40,80,0.3)]">
              Ten minutes today. A tougher client tomorrow. Clear evidence you&apos;re ready by review time.
            </p>
            <div className="mt-2 flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
              <Link href={primaryHref} className={`group ${SKY_PRIMARY}`}>
                {primaryLabel}
                <ArrowRight size={17} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              {!signedIn && (
                <Link
                  href="/login"
                  className="text-[15px] font-semibold text-white underline decoration-white/60 decoration-2 underline-offset-[6px] hover:decoration-white"
                >
                  I already have an account
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className={`${CONTAINER} flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center`}>
        <div className="flex flex-col gap-2">
          <Link href="/welcome" aria-label="Consulting Coach home" className="self-start">
            <Logo />
          </Link>
          <p className="m-0 text-[13px] text-muted">© Consulting Coach. AI coaching for technology &amp; transformation consultants.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-2 p-0 text-sm font-medium">
            <li>
              <a href="#features" className="text-ink-2 hover:text-ink">
                Features
              </a>
            </li>
            <li>
              <a href="#pricing" className="text-ink-2 hover:text-ink">
                Pricing
              </a>
            </li>
            <li>
              <Link href="/login" className="text-ink-2 hover:text-ink">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/signup" className="text-primary hover:text-primary-hover">
                Start free
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

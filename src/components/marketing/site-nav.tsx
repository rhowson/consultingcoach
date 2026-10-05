"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#assessments", label: "Assessments" },
];

/** Floating glass pill nav. Collapses to a menu button below md. */
export function SiteNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const cta = signedIn ? { href: "/", label: "Go to app" } : { href: "/signup", label: "Start free" };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Main"
        className="glass mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full py-2 pr-2 pl-4 shadow-md sm:pl-5"
      >
        <Link href="/welcome" aria-label="Consulting Coach home" className="shrink-0 rounded-full">
          <Logo />
        </Link>

        <ul className="m-0 hidden list-none items-center gap-1 p-0 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          {!signedIn && (
            <Link
              href="/login"
              className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink sm:inline-flex"
            >
              Sign in
            </Link>
          )}
          <Link
            href={cta.href}
            className="group hidden h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold whitespace-nowrap text-on-primary shadow-sm transition-all hover:bg-primary-hover hover:shadow-md sm:inline-flex"
          >
            {cta.label}
            <ArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface md:hidden"
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="glass mx-auto mt-2 max-w-6xl rounded-xl p-2 shadow-lg md:hidden">
          <ul className="m-0 flex list-none flex-col p-0">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center rounded-md px-3 text-[15px] font-medium text-ink hover:bg-surface"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
            {signedIn ? (
              <Link
                href="/"
                className="col-span-2 flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-on-primary"
              >
                Go to app <ArrowRight size={15} aria-hidden />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex h-11 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-ink"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-on-primary"
                >
                  Start free <ArrowRight size={15} aria-hidden />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

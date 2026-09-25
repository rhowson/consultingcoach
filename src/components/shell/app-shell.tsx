"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Ellipsis, Flame, Search } from "lucide-react";
import type { Level } from "@/lib/competency";
import { LEVEL_LABELS } from "@/lib/competency";
import { ReadinessPill } from "@/components/ui/badges";
import { UserAvatar } from "@/components/ui/avatar";
import { NAV, isActive, titleFor } from "./nav-items";

export interface ShellData {
  name: string;
  currentLevel: Level;
  targetLevel: Level;
  readiness: number;
  streakDays: number;
}

export function AppShell({ data, children }: { data: ShellData; children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar (desktop) */}
      <nav
        aria-label="Primary"
        className="sticky top-0 hidden h-screen w-60 flex-none flex-col border-r border-border bg-surface px-3 py-5 lg:flex"
      >
        <Link href="/" className="flex items-center gap-2.5 px-2.5 pt-0.5 pb-6 text-ink no-underline">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-serif text-base font-semibold text-on-primary">C</span>
          <span className="font-serif text-lg font-semibold tracking-tight">Consulting Coach</span>
        </Link>
        <div className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-2.5 py-2 text-sm no-underline ${
                  active ? "bg-primary-tint font-semibold text-primary" : "font-medium text-ink-2 hover:bg-hover"
                }`}
              >
                <Icon size={20} strokeWidth={1.5} aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
        <Link href="/settings" className="mt-auto flex items-center gap-2.5 border-t border-border px-2.5 py-3 text-ink no-underline">
          <UserAvatar name={data.name} />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">{data.name}</span>
            <span className="text-xs text-muted">{LEVEL_LABELS[data.currentLevel]}</span>
          </span>
        </Link>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-bg px-4 md:px-8">
          <h1 className="m-0 font-serif text-2xl font-semibold tracking-tight">{titleFor(pathname)}</h1>
          <div className="flex-1" />
          <Link
            href="/practice"
            aria-label="Search lessons and scenarios"
            className="hidden h-9 w-60 items-center gap-2 rounded-md border border-border bg-surface pr-2.5 pl-3 text-sm text-muted no-underline hover:bg-hover lg:flex"
          >
            <Search size={16} aria-hidden />
            Search lessons, scenarios
          </Link>
          <div title={`${data.streakDays}-day streak`} className="tabular flex items-center gap-1 text-sm font-semibold">
            <Flame size={18} className="text-warning" aria-hidden />
            {data.streakDays}
          </div>
          <ReadinessPill from={data.currentLevel} to={data.targetLevel} percent={data.readiness} />
          <Link href="/settings" className="hidden lg:block" aria-label="Settings">
            <UserAvatar name={data.name} />
          </Link>
        </header>

        <main className="w-full max-w-[1240px] px-4 pt-8 pb-24 md:px-8 lg:pb-12">{children}</main>
      </div>

      {/* Bottom tab bar (mobile) */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-20 grid h-[68px] grid-cols-5 border-t border-border bg-surface lg:hidden">
        {NAV.filter((n) => n.mobile).map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-[3px] text-[11px] no-underline ${active ? "font-semibold text-primary" : "font-medium text-muted"}`}
            >
              <Icon size={22} strokeWidth={1.5} aria-hidden />
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className="flex flex-col items-center justify-center gap-[3px] border-0 bg-transparent text-[11px] font-medium text-muted"
        >
          <Ellipsis size={22} strokeWidth={1.5} aria-hidden />
          More
        </button>
        {moreOpen && (
          <div className="absolute right-2 bottom-[72px] flex w-56 flex-col rounded-lg border border-border bg-surface p-1 shadow-lg">
            {NAV.filter((n) => !n.mobile).map(({ href, label, Icon }) => (
              <Link key={href} href={href} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink no-underline hover:bg-hover">
                <Icon size={18} strokeWidth={1.5} aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}

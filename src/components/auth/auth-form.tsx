"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, CircleAlert } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function AuthForm({ mode, requiresAccessCode = false }: { mode: "login" | "signup"; requiresAccessCode?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(values: { email: string; password: string; name?: string; accessCode?: string }) {
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup")
        await api.auth.signup({ email: values.email, password: values.password, name: values.name ?? "", accessCode: values.accessCode || undefined });
      else await api.auth.login(values);
      router.replace(mode === "signup" ? "/onboarding" : "/");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <SkyPanel />

      <main className="flex min-w-0 flex-1 flex-col px-4 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link href="/welcome" aria-label="Consulting Coach home" className="rounded-md lg:hidden">
            <Logo />
          </Link>
          <Link
            href="/welcome"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            <ArrowLeft size={15} aria-hidden />
            Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="flex w-full max-w-[420px] flex-col gap-7">
            <div className="flex flex-col gap-2">
              <h1 className="m-0 font-display text-[32px] leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
                {mode === "login" ? "Welcome back" : "Start your diagnostic"}
              </h1>
              <p className="m-0 text-[16px] leading-relaxed text-ink-2">
                {mode === "login"
                  ? "Pick up your development plan where you left off."
                  : "Practise client conversations, storylines and SteerCo delivery with an AI coach."}
              </p>
            </div>

            <form
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-md sm:p-7"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                submit({ email: String(f.get("email")), password: String(f.get("password")), name: String(f.get("name") ?? ""), accessCode: String(f.get("accessCode") ?? "") });
              }}
            >
              {mode === "signup" && <Field label="Name" name="name" autoComplete="name" required />}
              <Field label="Email" name="email" type="email" autoComplete="email" required />
              <Field
                label="Password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "signup" ? 8 : undefined}
                hint={mode === "signup" ? "At least 8 characters." : undefined}
                required
              />
              {mode === "signup" && requiresAccessCode && (
                <Field label="Access code" name="accessCode" autoComplete="off" hint="Provided by your firm or programme lead." required />
              )}
              {error && (
                <p role="alert" className="m-0 flex items-start gap-2 rounded-md bg-danger-tint px-3 py-2.5 text-sm text-danger">
                  <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" disabled={busy} className="mt-1 w-full">
                {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <p className="m-0 text-center text-sm text-muted">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <Link href="/signup" className="font-semibold text-primary hover:text-primary-hover">
                    Create an account
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, hint, ...props }: { label: string; hint?: string } & React.ComponentProps<"input">) {
  const hintId = hint ? `${props.name}-hint` : undefined;
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
      {label}
      <input
        {...props}
        aria-describedby={hintId}
        className="h-11 rounded-md border border-border-strong bg-surface px-3.5 text-[15px] font-normal text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-faint hover:border-faint focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none"
      />
      {hint && (
        <span id={hintId} className="text-[13px] font-normal text-muted">
          {hint}
        </span>
      )}
    </label>
  );
}

/** Left-hand brand panel (lg+): sky gradient, value headline and two glass cards. Decorative beyond the headline. */
function SkyPanel() {
  return (
    <aside className="sky relative hidden w-[46%] max-w-[680px] shrink-0 flex-col overflow-hidden p-10 lg:flex xl:p-14">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-linear-to-b from-[rgba(10,40,80,0.22)] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-24 h-64 w-96 rounded-full bg-white/25 blur-3xl" />

      <Link href="/welcome" aria-label="Consulting Coach home" className="relative self-start rounded-md">
        <Logo variant="light" />
      </Link>

      <div className="relative mt-auto flex flex-col gap-8 pt-16">
        <p className="m-0 max-w-md font-display text-[40px] leading-[1.05] font-semibold tracking-[-0.04em] text-balance text-white [text-shadow:0_2px_20px_rgba(10,40,80,0.25)] xl:text-5xl">
          Practise the moments that make your career.
        </p>

        <div aria-hidden className="flex max-w-md flex-col gap-4">
          <div className="glass rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow">Last rep · SteerCo Rehearsal</span>
              <span className="rounded-full bg-success-tint px-2 py-0.5 text-[11px] font-semibold text-success">Meets bar</span>
            </div>
            <div className="mt-3 flex items-end gap-4">
              <span className="tabular font-display text-4xl leading-none font-semibold tracking-tight text-ink">
                4.2<span className="text-lg text-muted">/5</span>
              </span>
              <div className="flex flex-1 items-end gap-1.5 pb-1">
                {[38, 52, 46, 64, 72, 84].map((h, i) => (
                  <span key={i} className={`flex-1 rounded-t-[3px] ${i === 5 ? "bg-primary" : "bg-primary/30"}`} style={{ height: `${h * 0.45}px` }} />
                ))}
              </div>
            </div>
            <p className="m-0 mt-3 text-[13px] text-ink-2">Scored against the Manager bar</p>
          </div>

          <ul className="glass m-0 flex list-none flex-col gap-3 rounded-xl p-5 shadow-lg">
            {["Realistic client personas who push back", "Feedback on every turn, not once a year", "Readiness for your next level, by competency"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-[14px] font-medium text-ink">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                  <Check size={12} strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

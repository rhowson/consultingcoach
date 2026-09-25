"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { Button } from "@/components/ui/button";

const DEMO = { email: "priya@demo.consultingcoach.app", password: "coachdemo" };

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(values: { email: string; password: string; name?: string }) {
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") await api.auth.signup({ email: values.email, password: values.password, name: values.name ?? "" });
      else await api.auth.login(values);
      router.replace(mode === "signup" ? "/onboarding" : "/");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-serif text-lg font-semibold text-on-primary">C</span>
          <span className="font-serif text-xl font-semibold tracking-tight">Consulting Coach</span>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="m-0 font-serif text-[32px] leading-tight font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Start your diagnostic"}
          </h1>
          <p className="m-0 text-ink-2">
            {mode === "login"
              ? "Pick up your development plan where you left off."
              : "Practise client conversations, storylines and SteerCo delivery with an AI coach."}
          </p>
        </div>

        <form
          className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            submit({ email: String(f.get("email")), password: String(f.get("password")), name: String(f.get("name") ?? "") });
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
            required
          />
          {error && (
            <p role="alert" className="m-0 flex items-center gap-1.5 text-sm text-danger">
              <CircleAlert size={16} aria-hidden />
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
          {mode === "login" && (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => submit(DEMO)}>
              Try the demo as Priya
            </Button>
          )}
        </form>

        <p className="m-0 text-center text-sm text-muted">
          {mode === "login" ? (
            <>
              New here? <Link href="/signup" className="font-medium text-primary">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link href="/login" className="font-medium text-primary">Sign in</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input
        {...props}
        className="h-10 rounded-md border border-border-strong bg-surface px-3 text-[15px] font-normal text-ink focus:border-primary focus:outline-none"
      />
    </label>
  );
}

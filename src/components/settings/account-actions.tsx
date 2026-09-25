"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleAlert, LogOut } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AccountActions() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setSigningOut(true);
    try {
      await api.auth.logout();
    } catch {
      // The session cookie is cleared server-side; if the call failed we still leave.
    }
    router.replace("/login");
    router.refresh();
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== "DELETE") return;
    setDeleting(true);
    setError(null);
    try {
      await api.me.delete();
      router.replace("/signup");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete your account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <>
      <Card aria-labelledby="session-title" className="flex flex-wrap items-center justify-between gap-3 p-6">
        <div className="flex flex-col gap-0.5">
          <CardTitle id="session-title">Session</CardTitle>
          <span className="text-sm text-muted">Sign out of Consulting Coach on this device.</span>
        </div>
        <Button variant="secondary" onClick={signOut} disabled={signingOut}>
          <LogOut size={16} aria-hidden />
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </Card>

      <Card aria-labelledby="danger-title" className="flex flex-col gap-4 border-danger/40 p-6">
        <div className="flex flex-col gap-1">
          <CardTitle id="danger-title" className="text-danger">
            Danger zone
          </CardTitle>
          <p className="m-0 text-sm text-ink-2">
            Deleting your account permanently removes your profile, scores, reps, storyboards and Red Pen reviews. This can&apos;t be undone.
          </p>
        </div>
        <form onSubmit={deleteAccount} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="del-confirm" className="text-sm font-medium">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </label>
            <input
              id="del-confirm"
              value={confirm}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink focus-visible:border-danger focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-danger"
            />
          </div>
          <Button type="submit" variant="destructive" disabled={confirm !== "DELETE" || deleting} className="h-10">
            {deleting ? "Deleting…" : "Delete account"}
          </Button>
        </form>
        {error && (
          <p role="alert" className="m-0 flex items-center gap-1.5 text-sm text-danger">
            <CircleAlert size={16} aria-hidden /> {error}
          </p>
        )}
      </Card>
    </>
  );
}

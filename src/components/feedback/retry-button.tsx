"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { Button } from "@/components/ui/button";

/** Starts a new simulation (optionally replaying from a turn of a previous attempt) and opens it. */
export function RetrySimButton({
  scenarioId,
  retryOf,
  fromTurn,
  children,
  size = "md",
}: {
  scenarioId: string;
  retryOf?: string;
  fromTurn?: number;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const view = await api.simulations.start(retryOf ? { scenarioId, retryOf, fromTurn } : { scenarioId });
      router.push(`/practice/sim/${view.attempt.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't start a new session. Try again.");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button variant="secondary" size={size} onClick={start} disabled={busy} aria-busy={busy}>
        <RotateCcw size={16} aria-hidden />
        {busy ? "Starting…" : children}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </span>
  );
}

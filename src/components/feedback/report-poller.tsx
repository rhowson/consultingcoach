"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-renders the server page every few seconds while the coach is still reviewing. */
export function ReportPoller({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const iv = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(iv);
  }, [router, intervalMs]);
  return null;
}

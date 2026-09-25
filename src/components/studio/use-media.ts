"use client";

import { useSyncExternalStore } from "react";

/** Whether the media query matches; `null` during server render and hydration. */
export function useMedia(query: string): boolean | null {
  return useSyncExternalStore<boolean | null>(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}

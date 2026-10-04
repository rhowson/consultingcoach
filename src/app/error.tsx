"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-bg px-4 py-16">
      <div className="flex max-w-md flex-col items-start gap-4">
        <span className="eyebrow">Something went wrong</span>
        <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold tracking-tight">This page didn&apos;t load properly</h1>
        <p className="m-0 text-ink-2">
          Your work is saved. Try again, and if it keeps happening, let your administrator know
          {error.digest ? ` (reference ${error.digest})` : ""}.
        </p>
        <div className="flex gap-2">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            Back to Home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

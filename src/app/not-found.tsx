import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="flex max-w-md flex-col items-start gap-4">
        <span className="eyebrow">404</span>
        <h1 className="m-0 font-serif text-[32px] leading-tight font-semibold tracking-tight">We couldn&apos;t find that page</h1>
        <p className="m-0 text-ink-2">The link may be out of date, or the item may belong to another account.</p>
        <ButtonLink href="/" size="lg">
          Back to Home
        </ButtonLink>
      </div>
    </main>
  );
}

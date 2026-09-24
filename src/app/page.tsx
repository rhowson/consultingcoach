// Placeholder until the Claude Design front end lands. Lists the API surface for developers.
const groups = [
  ["Auth", ["POST /api/auth/signup", "POST /api/auth/login", "POST /api/auth/logout", "GET|PATCH|DELETE /api/me"]],
  ["Onboarding & progress", ["GET|POST /api/onboarding", "GET /api/dashboard", "GET /api/progress"]],
  ["Practice", ["GET /api/scenarios", "GET /api/scenarios/:id", "POST /api/simulations", "POST /api/simulations/:id/messages (SSE)", "POST /api/simulations/:id/complete", "GET /api/feedback/:attemptId"]],
  ["Studio", ["GET /api/studio/cases", "POST /api/studio/storyboards", "PATCH /api/studio/storyboards/:id", "POST /api/studio/storyboards/:id/review", "POST /api/studio/storyboards/:id/submit"]],
  ["Learn & Red Pen", ["GET /api/learn/tracks", "GET /api/learn/lessons/:id", "GET|POST /api/red-pen"]],
] as const;

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl font-semibold text-primary">Consulting Coach</h1>
      <p className="mt-3 text-ink-muted">Back end is running. The front end is being designed. See docs/API.md for details.</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {groups.map(([title, routes]) => (
          <section key={title} className="rounded-lg border border-border bg-surface p-6">
            <h2 className="font-semibold">{title}</h2>
            <ul className="mt-3 space-y-1 font-mono text-sm text-ink-muted">
              {routes.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

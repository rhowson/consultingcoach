# Consulting Coach

An AI coaching app that trains consultants from Analyst to Director. Users practise client conversations with AI personas, build storylines in a Storyboard Studio, get deliverables marked up by a "Partner Red Pen", and track readiness for the next level.

The front end is built from the Claude Design project (tokens, Home, Client Simulator, Storyboard Studio, SteerCo Rehearsal) and the [front-end spec](https://claude.ai/code/artifact/8ab7cfd6-b1f5-43a4-822e-cacfff7f0c38), on top of the JSON API in `src/app/api`.

| Screen | Route |
| --- | --- |
| Login / signup (with demo sign-in) | `/login`, `/signup` |
| Onboarding diagnostic | `/onboarding` |
| Home dashboard | `/` |
| Learn (tracks, lessons, quizzes) | `/learn`, `/learn/:id` |
| Practice hub + briefing drawer | `/practice` |
| Client Simulator | `/practice/sim/:attemptId` |
| Feedback report | `/feedback/:attemptId` |
| Storyboard Studio | `/studio`, `/studio/:id` |
| SteerCo Rehearsal | `/rehearsal/:storyboardId` |
| Partner Red Pen | `/red-pen`, `/red-pen/:id` |
| Progress | `/progress` |
| Settings | `/settings` |

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router, route handlers), React 19, TypeScript |
| Styling | Tailwind CSS 4, design tokens in `src/app/globals.css` |
| Database | Postgres + Drizzle ORM (`src/db/schema.ts`, migrations in `drizzle/`) |
| Auth | Email + password (bcrypt), signed JWT session cookie (`jose`) |
| AI | Claude API via `@anthropic-ai/sdk` (`claude-opus-5` by default) |
| Tests | Vitest |
| Deploy | Railway (`railway.json`) |

## Getting started

```bash
cp .env.example .env            # fill in DATABASE_URL, AUTH_SECRET, optionally ANTHROPIC_API_KEY
docker compose up -d db         # or use any Postgres 16
npm install
npm run db:migrate
npm run db:seed                 # content + demo user priya@demo.consultingcoach.app / coachdemo
npm run dev
```

Without `ANTHROPIC_API_KEY` the AI engine runs in **mock mode**: scripted persona replies and heuristic scores. Every flow works end to end, so front-end work doesn't need a key. `GET /api/health` reports `"ai": "mock"` or `"live"`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build / server (respects `PORT`) |
| `npm test` | Unit tests (mock AI) |
| `npm run typecheck` / `npm run lint` | Static checks |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` / `npm run db:seed` | Apply migrations / upsert content |

## How the coaching engine works

Each practice session uses three separate AI roles (`src/lib/ai/`):

1. **Actor**: the client persona. It plays from a hidden brief (motivations, triggers, trust builders), streams in-character replies and never coaches.
2. **Evaluator**: scores the transcript or storyboard against a level-specific rubric, 1–5 per criterion, citing evidence.
3. **Coach**: turns the scores into the moments that mattered, with "try instead" rewrites and the top 3 behaviours to change, in the user's chosen tone.

After each turn a lightweight **signals** call updates the mood meter and objective checkpoints. Scores feed the competency matrix (`src/lib/competency.ts`). Scores are normalised to the user's target level and blended with an exponential moving average, and readiness is capped per competency so a strength can't hide a gap.

Every Claude request opts into server-side refusal fallbacks (`fallbacks: "default"`) and handles `stop_reason: "refusal"`.

## Layout

```
src/
  app/              Pages: (app) shell screens, (session) full-screen sessions, (auth), onboarding
  app/api/          Route handlers (see docs/API.md)
  components/       UI: ui/ primitives, shell/, and one folder per screen
  lib/client/       Typed browser API client + SSE reader
  content/          Seed content: personas, scenarios, rubrics, case packs, lessons
  db/               Drizzle schema, client, migrate + seed scripts
  lib/ai/           Claude client, prompts, engine, mock engine
  lib/services/     Business logic (attempts, studio, progress, onboarding, learn, red pen)
  lib/competency.ts Levels, competencies, readiness maths
  lib/types.ts      Shared domain types (API contract)
drizzle/            SQL migrations
```

## Deploying to Railway

1. Create a project with a **Postgres** service and a service from this repo.
2. Set `DATABASE_URL` (reference the Postgres variable), `AUTH_SECRET` (`openssl rand -base64 32`) and `ANTHROPIC_API_KEY` on the app service.
3. Deploy. `railway.json` runs migrations before each deploy and health-checks `/api/health`. Run `npm run db:seed` once (for example with `railway run npm run db:seed`) to load content.

## Not built yet

- SteerCo Rehearsal questions are scripted client-side and not scored yet
- Pro plan / billing (Pro scenarios always show as locked)
- File parsing for Red Pen uploads (the API takes plain text for now)
- Voice mode and the B2B team dashboard
- Rate limiting on AI endpoints

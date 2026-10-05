# Consulting Coach

An AI coaching app that trains consultants from Analyst to Director. Users practise client conversations with AI personas, build storylines in a Storyboard Studio, get deliverables marked up by a "Partner Red Pen", and track readiness for the next level.

The front end is built from the Claude Design project (tokens, Home, Client Simulator, Storyboard Studio, SteerCo Rehearsal) and the [front-end spec](https://claude.ai/code/artifact/8ab7cfd6-b1f5-43a4-822e-cacfff7f0c38), on top of the JSON API in `src/app/api`.

The app is organised around five jobs, one per sidebar item:

| Job | Route | What it's for |
| --- | --- | --- |
| Home | `/` | Where you are and the one thing to do next |
| Practice | `/practice` | Client conversations (`/practice/sim/:id`) and storylines (`/studio/:id`), each ending in a feedback report (`/feedback/:id`) |
| Learn | `/learn` | Short lessons, including a client leadership & business development group |
| Review | `/red-pen` | Paste a real deliverable and get a partner's mark-up |
| Progress | `/progress` | Readiness by competency, your plan, trend and history |

Assessors also see **Assessments** (`/assess`). Candidates take interviews at `/interview/:token`. Settings are under the avatar. Logged-out visitors see the landing page at `/welcome`; sign-in is at `/login` and `/signup`.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router, route handlers), React 19, TypeScript |
| Styling | Tailwind CSS 4, design tokens in `src/app/globals.css` |
| Database | Postgres + Drizzle ORM (`src/db/schema.ts`, migrations in `drizzle/`) |
| Auth | Email + password (bcrypt), signed JWT session cookie (`jose`) |
| AI | Claude API via `@anthropic-ai/sdk` (`claude-opus-5` by default) |
| Tests | Vitest |
| Deploy | Railway |

## Getting started

```bash
cp .env.example .env            # fill in DATABASE_URL, AUTH_SECRET, optionally ANTHROPIC_API_KEY
docker compose up -d db         # or use any Postgres 16
npm install
npm run db:migrate
npm run db:seed                 # content + demo user priya@demo.consultingcoach.app (password: DEMO_PASSWORD, or "coachdemo" locally)
npm run dev
```

Without `ANTHROPIC_API_KEY` (in development) or with `AI_MOCK=1`, the AI engine runs in **practice/mock mode**: scripted persona replies and heuristic scores. Every flow works end to end, so front-end work doesn't need a key. `GET /api/health` reports `"ai": "mock"` or `"live"`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build / server (respects `PORT`) |
| `npm test` | Unit tests (mock AI) |
| `npm run typecheck` / `npm run lint` | Static checks |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` / `npm run db:seed` | Apply migrations / upsert content |

## Scenario catalogue

Scenarios are UK technology and transformation engagements, priced in £, tagged with a practice area (`src/lib/practice-areas.ts`) and seeded from `src/content/`:

| Practice area | Client Simulator | Storyboard Studio |
| --- | --- | --- |
| Enterprise technology | The cloud bill shock (CIO, Manager) | – |
| Data & AI | The pilot isn't ready (CDO, Consultant); That's all you're getting (Head of MI, Analyst) | Meridian Insurance: why hasn't the £14m data platform delivered? (Consultant) |
| Programme delivery | Green on the outside (Programme Director, Manager); While you're here… (Director of Digital, Consultant) | – |
| Change & culture | The leaked operating model (Director of Housing Operations, Manager) | – |
| Commercial advisory & decision support | Your benefits case is wrong (CFO, Consultant); The 10-minute CEO (Chief Executive, Director) | Calder Water: renew, re-tender or insource IT services? (Manager) |
| Programme delivery: engagement set-up | Start on Monday (Chief Transformation Officer, Manager) | – |
| Business development | First meeting with a new CIO (Manager); Procurement wants 20% off (Head of Procurement, Director); Earn the follow-on (COO, Director) | – |

Learn has a **Running engagements** group with a six-lesson track, Setting Up an Engagement: scope and the SOW, staffing and selecting associates, contracting and onboarding associates (IR35, BPSS, conflicts, data), governance and kick-off, commercials and margin, and close and handover. Learn also has a separate **Client leadership & business development** group for client directors and people who sell services, with four tracks: Account Leadership, Winning Work, Commercial Conversations and Trusted Advisor (`BUSINESS_DEVELOPMENT_TRACK_IDS` in `src/lib/learn-groups.ts`). Business development scenarios use their own rubric: discovery, value framing, commercial judgement and advancing the opportunity.

Retired scenarios (`retiredScenarioIds`) stay in the database so old reports still work, but are hidden from the catalogue.

## Interview assessment mode

Use this to assess candidates in interviews. An assessor creates an interview at `/assess` and sends the candidate a one-time link. The candidate doesn't need an account.

The exercise lasts 60 minutes, has four timed sections and is set on one UK case (Kestrel Energy: AI in customer service):

| Section | Time | Tests | AI |
| --- | --- | --- | --- |
| 1. Read and frame the problem | 15 min | Critical thinking: problem framing, hypothesis, scepticism about the data | None |
| 2. Analyse with an AI assistant | 20 min | AI fluency and commercial judgement: a 300-word CEO memo | A scoped assistant |
| 3. Defend it to the client | 10 min | Communication: a live conversation with the CCO about the memo | None |
| 4. Reflect | 5 min | Self-awareness about how they used AI | None |

**Guardrails.**

- The assistant exists only in section 2. It answers only from the case pack and won't write the memo.
- Every prompt is screened first by a deterministic prompt-injection filter and then by a classifier.
- Blocked prompts get a fixed refusal and are logged.
- Timers, section order and answer locking are enforced on the server.

**What the report shows.**

- The AI pre-read contains a planted error, and the report says whether the candidate caught it.
- Integrity signals: pastes, tab switches, and how much of the memo overlaps assistant replies.
- Scores (1–5) on critical thinking, communication, AI fluency and commercial judgement, each with evidence.
- A hire recommendation and follow-up questions for the live interview.

Only users whose email is in `ASSESSOR_EMAILS` can see `/assess`. In production, scoring needs `ANTHROPIC_API_KEY`.

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

The live app runs in the Railway project `consultingcoach` (service `app` + `Postgres`). The service settings are configured in Railway itself (Railway no longer reads `railway.json`):

| Setting | Value |
| --- | --- |
| Source | `rhowson/consultingcoach`, branch `claude/busy-einstein-lxzanf` |
| Build command | `npm run build` |
| Pre-deploy command | `npm run db:migrate && npm run db:seed` (idempotent) |
| Start command | `npm run start` |
| Health check | `/api/health` (fails if the database has no tables) |
| Variables | `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`, `AUTH_SECRET`, `NODE_ENV=production`, `DEMO_PASSWORD` (demo account password), `ANTHROPIC_API_KEY` (required: without it AI features are off in production, never simulated), optional `SIGNUP_ACCESS_CODE` (invite-only sign-up), `ASSESSOR_EMAILS` (comma-separated; who can run interview assessments), optional `AI_MODEL` |

Deploy-on-push needs the Railway GitHub App installed on the repository.

## Not built yet

These are deliberately hidden from the interface until they're finished:

- SteerCo Rehearsal: its questions are scripted in the browser and not scored. The `/rehearsal/:id` route still exists but nothing links to it.
- Voice mode
- Pro plan / billing
- File upload for Red Pen (it takes pasted text for now)
- A team dashboard for firms

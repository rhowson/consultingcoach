# API reference

All endpoints are JSON over HTTPS under `/api`. Authentication is a `cc_session` httpOnly cookie that signup and login set, so browser `fetch` calls on the same origin need no extra headers.

**Errors** always look like this: `{ "error": { "code": string, "message": string, "issues"?: [...] } }`

| Status | Codes |
| --- | --- |
| 400 | `bad_request` |
| 401 | `unauthorized`, `invalid_credentials` |
| 404 | `not_found`, `report_not_ready` |
| 409 | `email_taken`, `attempt_closed`, `awaiting_reply`, `turn_limit`, `attempt_busy`, `no_hints`, `submitted` |
| 422 | `validation_error` (with Zod `issues`) |
| 500 | `internal` |

Shared types (`Level`, `Competency`, `Mood`, `PyramidNode`, `GhostSlide`, `StudioComment`, `CriterionScore`, `FeedbackMoment`, …) are in `src/lib/types.ts` and `src/lib/competency.ts`.

- `Level` is one of `analyst | consultant | manager | director`.
- `Competency` is one of `problem_solving | storyboarding | client_management | difficult_conversations | output_quality`.
- `Verdict` is one of `meets | approaching | below`.

---

## Auth and profile

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/auth/signup` | `{ email, password (≥8), name }` | `201 { user }` and sets the cookie |
| POST | `/auth/login` | `{ email, password }` | `{ user }` and sets the cookie |
| POST | `/auth/logout` | none | `{ ok }` |
| GET | `/me` | none | `{ user }` |
| PATCH | `/me` | any of `{ name, currentLevel, targetLevel, targetDate, weeklyRepGoal, coachTone }` | `{ user }` |
| DELETE | `/me` | none | `{ deleted }`; deletes the account and all data |

`user` contains `id, email, name, currentLevel, targetLevel, targetDate, goal, weeklyRepGoal, coachTone ("supportive"|"direct"|"partner"), onboardedAt, createdAt`. Redirect users to onboarding while `onboardedAt` is null.

## Onboarding (spec §5.2)

- **GET `/onboarding`** returns `{ diagnosticScenarioId, diagnosticMaxTurns, titleQuiz: [{ id, exhibit, options[] }] }`.
- For step 4 (the mini-simulation), start a normal simulation on `diagnosticScenarioId` (see Simulator). After `diagnosticMaxTurns` of your turns, call `/complete`; its scores carry into placement.
- **POST `/onboarding`** takes `{ currentLevel, targetLevel?, goal: "promotion"|"break_in"|"sharpen_skill", targetDate?, selfRatings: Record<Competency, 1–5>, quizAnswers: Record<questionId, optionIndex> }`. It returns `{ readiness, selfRatings, focus: Competency, plan }`. Use this for the result screen's radar chart: self-ratings vs `readiness.competencies[].score`.

## Home and progress (spec §5.3, §5.11)

**GET `/dashboard`** returns:

```ts
{
  readiness: { currentLevel, targetLevel, percent, bar: 3.5, competencies: [{ competency, score, verdict }] },
  todaysRep: { scenario, reason } | null,
  week: { goal, done, streakDays },
  plan: { focus, weeks: [{ week, theme, items: [{ kind: "lesson"|"scenario", refId, title }] }] } | null,
  recentFeedback: [{ attemptId, scenarioTitle, overallScore, verdict, completedAt }],
  continueLearning: [{ id, trackId, title, level, durationMin }]
}
```

**GET `/progress`** returns:

```ts
{
  readiness,
  trend: [{ competency, score, at }],              // last 12 weeks, one point per change
  attempts: [{ attemptId, scenarioId, scenarioTitle, mode, targetLevel, overallScore, verdict, completedAt }],
  promotionChecklist: [{ competency, recentScores: number[], met: boolean }]  // met = last 3 reps ≥ 3.5
}
```

## Practice hub (spec §5.5)

- **GET `/scenarios?kind=simulation|storyboard&competency=…&level=…`** returns `{ scenarios: [{ id, kind, title, summary, personaId, targetLevel, difficulty (1–3), durationMin, competencies, isPro, bestScore, attempted }] }`.
- **GET `/scenarios/:id`** (for the briefing drawer) returns `{ scenario: { …, briefing: { situation, yourRole, objective, whatGoodLooksLike: Record<Level,string> }, objectives: [{ id, label }], maxTurns }, persona, rubric: { criteria: [{ id, label, competency, description }] } }`.
- **GET `/personas`** returns `{ personas: [{ id, name, title, company, personality, avatarKey }] }`.

## Client Simulator (spec §5.6)

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/simulations` | `{ scenarioId, targetLevel?, retryOf?, fromTurn? }` | `201 SimulationView` |
| GET | `/simulations/:id` | none | `SimulationView` |
| POST | `/simulations/:id/messages` | `{ content }` | Server-sent event stream (below) |
| POST | `/simulations/:id/hint` | none | `{ hint, hintsRemaining }` (max 2) |
| POST | `/simulations/:id/complete` | none | `FeedbackReport` (can take 10–60 s with a live model) |
| POST | `/simulations/:id/abandon` | none | `{ attempt }` |

`SimulationView` has this shape: `{ attempt: { id, status, mood, objectivesMet[], hintsUsed, … }, scenario: { …, briefing, objectives, maxTurns }, persona, messages: [{ turn, role: "user"|"persona", content }], hintsRemaining }`. The persona's opening line is message turn 0.

**Message stream.** The response is `text/event-stream`. Read it with `fetch` plus a stream reader. `EventSource` won't work because this is a POST. The events are:

```
event: user_message     data: {"turn":1}
event: delta            data: {"text":"I don't care about "}      ← append to the persona bubble
event: persona_message  data: {"turn":2,"content":"…full reply…"}
event: signals          data: {"mood":"frustrated","objectivesMet":["apologise"],"ended":false}
event: error            data: {"message":"…"}                      ← the user's message was rolled back; let them resend
```

When `signals.ended` is true, the persona closed the meeting or the turn limit was hit. Call `/complete` and then show the report.

**Retry this moment.** Call `POST /simulations` with `{ scenarioId, retryOf: <attemptId>, fromTurn: <moment.ref as number> }`. The new attempt copies the transcript up to just before that turn.

## Feedback report (spec §5.10)

**GET `/feedback/:attemptId`** returns the same shape as `/complete` and studio `/submit`:

```ts
{
  attempt, scenario, verdict, overallScore,
  summary: string,
  criteria: [{ criterionId, label, competency, score (1–5), rationale }],
  moments: [{ ref, quote, annotation, tryInstead }],  // ref = turn number (sim) or node/slide id (studio)
  topBehaviours: [string, string, string],
  competencyDeltas: Partial<Record<Competency, number>>,  // e.g. { client_management: +0.3 }
  readiness: { before, after },                           // percent
  nextLevel: Level | null
}
```

## Storyboard Studio (spec §5.7)

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/studio/cases` | none | `{ cases }` |
| POST | `/studio/storyboards` | `{ scenarioId }` | `{ storyboard }`; opens or resumes the draft |
| GET | `/studio/storyboards/:id` | none | `{ storyboard }` |
| PATCH | `/studio/storyboards/:id` | any of `{ stage, pyramid, slides }` | `{ storyboard }` (autosave) |
| POST | `/studio/storyboards/:id/review` | none | `{ storyboard }` with fresh `comments` |
| PATCH | `/studio/storyboards/:id/comments/:commentId` | `{ resolved }` | `{ storyboard }` |
| POST | `/studio/storyboards/:id/submit` | none | `FeedbackReport` |

The `storyboard` object has this shape: `{ id, stage: "pyramid"|"ghost_deck"|"review", pyramid: PyramidNode, slides: GhostSlide[], comments: StudioComment[], attemptId, case: { …scenario, briefing, casePack: { client, question, exhibits[], interviews[], clientEmail } } }`.

- A `PyramidNode` is `{ id, text, children[] }`. The root is the governing thought.
- Comments carry `targetId` (a node or slide id), `tag` (`structure|insight|mece|evidence|clarity`) and `severity` (`must_fix|should_fix|polish`).

## Learn (spec §5.4)

- **GET `/learn/tracks`** returns `{ tracks: [{ id, title, description, competency, lessonCount, durationMin, completedCount, lessons: [{ …, completed }] }] }`.
- **GET `/learn/lessons/:id`** returns `{ lesson: { …, blocks: LessonBlock[], completed, quizScore, practice: { id, kind, title, durationMin } | null } }`.
- **POST `/learn/lessons/:id/complete`** takes `{ quizScore? }`.

`LessonBlock` is one of `text`, `key_idea`, `example_pair { bad, good, annotation }` or `quiz { question, options, answerIndex, explanation }`.

## Partner Red Pen (spec §5.8)

- **POST `/red-pen`** takes `{ title, content (plain text), deliverableType: "steerco_deck"|"client_email"|"memo"|"exec_summary", targetLevel }`. It returns `201 { review: { …, result: { verdict, headline, topChanges[], annotations: [{ id, quote, severity, comment, rewrite }] } } }`.
- **GET `/red-pen`** returns `{ reviews }` (without content). **GET `/red-pen/:id`** returns `{ review }`. **DELETE `/red-pen/:id`** deletes it.

## Health

**GET `/health`** returns `{ ok, db: "up"|"down", ai: "mock"|"live" }`.

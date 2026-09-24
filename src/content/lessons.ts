import type { schema } from "@/db";

type Track = typeof schema.tracks.$inferInsert;
type Lesson = typeof schema.lessons.$inferInsert;

export const tracks: Track[] = [
  { id: "pyramid-principle", title: "Pyramid Principle", description: "Lead with the answer and structure the support.", competency: "storyboarding", order: 1 },
  { id: "hypothesis-driven", title: "Hypothesis-Driven Problem Solving", description: "Issue trees, hypotheses and the analyses that prove them.", competency: "problem_solving", order: 2 },
  { id: "action-titles", title: "Action Titles and Exhibits", description: "Titles that tell the story; charts that prove them.", competency: "output_quality", order: 3 },
  { id: "handling-pushback", title: "Handling Pushback", description: "Acknowledge, explore, reframe.", competency: "difficult_conversations", order: 4 },
  { id: "delivering-bad-news", title: "Delivering Bad News", description: "Say the hard thing early, clearly and kindly.", competency: "difficult_conversations", order: 5 },
  { id: "managing-scope", title: "Managing Scope", description: "Options, not refusals.", competency: "client_management", order: 6 },
  { id: "running-a-steerco", title: "Running a SteerCo", description: "Get decisions, not just nods.", competency: "client_management", order: 7 },
  { id: "executive-presence", title: "Executive Presence", description: "Brevity, calm and command of the room.", competency: "client_management", order: 8 },
];

export const lessons: Lesson[] = [
  {
    id: "pyramid-answer-first",
    trackId: "pyramid-principle",
    title: "Answer first",
    level: "analyst",
    durationMin: 6,
    order: 1,
    practiceScenarioId: "brightwave-churn",
    blocks: [
      { type: "text", markdown: "Senior readers want the answer before the reasoning. The pyramid starts with a **governing thought** — the single sentence you want them to remember — then groups the support beneath it." },
      { type: "key_idea", markdown: "If your reader stopped after the first sentence, would they know what you recommend and why?" },
      {
        type: "example_pair",
        bad: "We analysed churn across six quarters and three segments, looking at pricing, service and NPS.",
        good: "Churn is up because out-of-contract SMB customers are leaving for cheaper bundles; a targeted retention offer can recover most of the loss.",
        annotation: "The first describes the work. The second gives the answer and the action.",
      },
      {
        type: "quiz",
        question: "Which is the best governing thought?",
        options: ["Overview of churn drivers", "Churn rose 0.4 points", "SMB customers leaving at contract end drive the churn rise; a renewal programme fixes it", "We should look at pricing"],
        answerIndex: 2,
        explanation: "It answers 'why' and 'so what' in one sentence.",
      },
    ],
  },
  {
    id: "pyramid-mece",
    trackId: "pyramid-principle",
    title: "MECE key lines",
    level: "consultant",
    durationMin: 8,
    order: 2,
    practiceScenarioId: "brightwave-churn",
    blocks: [
      { type: "text", markdown: "Key lines under the governing thought should be **mutually exclusive** (no overlap) and **collectively exhaustive** (nothing important missing). Group by a single logic: steps, segments, or causes." },
      { type: "key_idea", markdown: "Three to four key lines. If you have seven, you haven't synthesised yet." },
      {
        type: "quiz",
        question: "Which set of key lines is MECE for 'why is churn up'?",
        options: ["Pricing; SMB; Service", "Consumer; SMB; Enterprise", "NPS; Complaints; Pricing; Everything else"],
        answerIndex: 1,
        explanation: "Segments don't overlap and cover the whole base. The first mixes a cause with a segment.",
      },
    ],
  },
  {
    id: "pushback-acknowledge",
    trackId: "handling-pushback",
    title: "Acknowledge before you argue",
    level: "consultant",
    durationMin: 5,
    order: 1,
    practiceScenarioId: "leaked-findings",
    blocks: [
      { type: "text", markdown: "When a client pushes back emotionally, facts land badly until the emotion is acknowledged. Use **acknowledge → explore → reframe**." },
      {
        type: "example_pair",
        bad: "I understand, but the numbers are based on benchmark data from 40 peers.",
        good: "You're right — you should have heard this from us first, and I'm sorry. Can we walk through what you've heard and where you think it's off?",
        annotation: "'I understand, but' cancels the acknowledgement. Own it, then ask.",
      },
      {
        type: "quiz",
        question: "What should come first when a client is angry about a finding?",
        options: ["The evidence", "An acknowledgement of their concern", "A escalation to your partner"],
        answerIndex: 1,
        explanation: "Trust first, then content.",
      },
    ],
  },
  {
    id: "scope-options",
    trackId: "managing-scope",
    title: "Offer options, not refusals",
    level: "consultant",
    durationMin: 5,
    order: 1,
    practiceScenarioId: "while-youre-here",
    blocks: [
      { type: "text", markdown: "A flat 'no' damages the relationship; a silent 'yes' damages the work. Make the trade-off explicit and offer choices: **swap**, **phase 2**, or **change order**." },
      { type: "key_idea", markdown: "\"Happy to — if we do that this week, the churn readout slips to next Friday. Would you rather swap it in, or scope it as phase 2?\"" },
    ],
  },
];

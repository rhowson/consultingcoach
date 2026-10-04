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
  { id: "running-a-steerco", title: "Running a SteerCo", description: "Honest status and decisions, not just nods.", competency: "client_management", order: 7 },
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
    practiceScenarioId: "meridian-data-platform",
    blocks: [
      { type: "text", markdown: "Senior readers want the answer before the reasoning. The pyramid starts with a **governing thought** — the single sentence you want them to remember — then groups the support beneath it." },
      { type: "key_idea", markdown: "If your reader stopped after the first sentence, would they know what you recommend and why?" },
      {
        type: "example_pair",
        bad: "We reviewed the data platform's spend, architecture, data quality and adoption over the last three years.",
        good: "The £14m platform works; value is blocked by poor claims and customer data with no business owners. Fund five owned use cases and fix data at source.",
        annotation: "The first describes the work. The second gives the answer and the action.",
      },
      {
        type: "quiz",
        question: "Which is the best governing thought for a board paper on the data platform?",
        options: [
          "Overview of the data platform programme",
          "Only 3 of 20 use cases are live",
          "The platform isn't the problem: unowned, poor-quality data is. Refocus funding on five owned use cases",
          "We should review the data strategy",
        ],
        answerIndex: 2,
        explanation: "It answers 'why' and 'so what' in one sentence, and tells the board what to do.",
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
    practiceScenarioId: "calder-managed-services",
    blocks: [
      { type: "text", markdown: "Key lines under the governing thought should be **mutually exclusive** (no overlap) and **collectively exhaustive** (nothing important missing). Group by a single logic: steps, options, or causes." },
      { type: "key_idea", markdown: "Three to four key lines. If you have seven, you haven't synthesised yet." },
      {
        type: "quiz",
        question: "Which set of key lines is MECE for 'should we renew, re-tender or insource IT services?'",
        options: [
          "Cost; Re-tender; Risk",
          "Renew costs most and fixes nothing; re-tender is cheapest and lowest risk; insourcing saves less and is hard to staff",
          "Service levels; Benchmarks; HR view; Everything else",
        ],
        answerIndex: 1,
        explanation: "One line per option, each with its verdict — no overlap and nothing missing. The first mixes a criterion with an option.",
      },
    ],
  },
  {
    id: "hypothesis-tree",
    trackId: "hypothesis-driven",
    title: "Start with a hypothesis tree",
    level: "consultant",
    durationMin: 7,
    order: 1,
    practiceScenarioId: "meridian-data-platform",
    blocks: [
      { type: "text", markdown: "Don't boil the ocean. Write down your best guess at the answer, break it into the **conditions that must be true**, and only collect data that proves or disproves each one." },
      {
        type: "example_pair",
        bad: "Workstreams: architecture review, tool assessment, data quality, stakeholder interviews, benchmarking.",
        good: "Hypothesis: value is blocked by data, not technology. True if (1) blocked use cases trace to poor data, (2) the poor data has no business owner, (3) the platform performs where data is good.",
        annotation: "The second tells the team exactly what to test — and when to stop.",
      },
      { type: "key_idea", markdown: "A good hypothesis can be proved wrong in a week. If it can't, it's a topic, not a hypothesis." },
    ],
  },
  {
    id: "titles-carry-the-number",
    trackId: "action-titles",
    title: "Titles that carry the number",
    level: "analyst",
    durationMin: 5,
    order: 1,
    practiceScenarioId: "calder-managed-services",
    blocks: [
      { type: "text", markdown: "An action title states the insight the exhibit proves — usually with the number that matters. Keep it to **15 words or fewer**." },
      {
        type: "example_pair",
        bad: "Five-year cost comparison of sourcing options",
        good: "Re-tendering saves £8.1m over five years against renewing as-is",
        annotation: "The topic tells the reader what the chart is about. The action title tells them what to conclude.",
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
    practiceScenarioId: "operating-model-leak",
    blocks: [
      { type: "text", markdown: "When a client pushes back emotionally, facts land badly until the emotion is acknowledged. Use **acknowledge → explore → reframe**." },
      {
        type: "example_pair",
        bad: "I understand, but the design is based on benchmarks from twelve comparable housing associations.",
        good: "You're right — you should have heard this from us, not a screenshot, and I'm sorry. Can we go through what the draft gets wrong for your teams and tenants?",
        annotation: "'I understand, but' cancels the acknowledgement. Own it, then ask.",
      },
      {
        type: "quiz",
        question: "What should come first when a client is angry about how they found out about a change?",
        options: ["The evidence for the change", "An acknowledgement of how they found out", "An escalation to your partner"],
        answerIndex: 1,
        explanation: "Trust first, then content.",
      },
    ],
  },
  {
    id: "bad-news-early",
    trackId: "delivering-bad-news",
    title: "Bad news early, with a path",
    level: "consultant",
    durationMin: 6,
    order: 1,
    practiceScenarioId: "genai-pilot-not-ready",
    blocks: [
      { type: "text", markdown: "Lead with the headline, give the two or three facts behind it, then the **path forward**. Bad news with no path feels like a dead end; bad news with a path feels like leadership." },
      {
        type: "example_pair",
        bad: "There are a few things to work through on the pilot before we think about scaling, mainly around accuracy and some risk items.",
        good: "It isn't ready to scale yet: accuracy is 81% against a 90% target and the DPIA isn't signed. We can be ready in eight weeks — here's the plan and what you can tell the board now.",
        annotation: "The first hedges. The second is clear, specific and gives her something to say.",
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
    practiceScenarioId: "scope-creep-crm",
    blocks: [
      { type: "text", markdown: "A flat 'no' damages the relationship; a silent 'yes' damages the delivery. Make the trade-off explicit and offer choices: **swap**, **phase 2**, or **change request**." },
      { type: "key_idea", markdown: "\"Happy to — if we add the chatbot now, the CRM release slips by three sprints. Would you rather swap it for the reporting pack, or scope it as phase 2?\"" },
    ],
  },
  {
    id: "honest-rag",
    trackId: "running-a-steerco",
    title: "Report the real RAG",
    level: "manager",
    durationMin: 6,
    order: 1,
    practiceScenarioId: "watermelon-status",
    blocks: [
      { type: "text", markdown: "A 'watermelon' programme is green on the outside and red inside. Reporting Amber when the facts say Red buys a fortnight and costs your credibility. Pair a Red status with a **recovery plan and the decision you need**: date, scope or resource." },
      {
        type: "quiz",
        question: "Mock data load 2 failed and testing is at 38% against a 70% plan, 11 weeks from go-live. What should the SteerCo see?",
        options: [
          "Amber, with a note that the team is confident of recovery",
          "Red, with a recovery plan and a decision on date, scope or resource",
          "Green until the next mock load, to avoid alarm",
        ],
        answerIndex: 1,
        explanation: "The facts say Red. The SteerCo's job is to make the decision that recovers it — give them that decision.",
      },
    ],
  },
  {
    id: "ten-minutes-with-the-ceo",
    trackId: "executive-presence",
    title: "Ten minutes with the CEO",
    level: "manager",
    durationMin: 5,
    order: 1,
    practiceScenarioId: "ten-minute-ceo",
    blocks: [
      { type: "text", markdown: "Executives decide on **outcome, cost, risk and timing** — not architecture. Open with the decision you need, then the one number and the one risk that matter." },
      {
        type: "example_pair",
        bad: "We assessed three architecture options against fourteen criteria including interoperability, scalability and vendor roadmap.",
        good: "I'm asking you to take a phased SaaS move to the board next month: £18m over five years, about £5m a year back from 2028, and it removes the outage risk the CQC asked about.",
        annotation: "Methodology can wait for the appendix.",
      },
    ],
  },
];

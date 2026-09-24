import type { schema } from "@/db";

type Rubric = typeof schema.rubrics.$inferInsert;
type Scenario = typeof schema.scenarios.$inferInsert;

export const rubrics: Rubric[] = [
  {
    id: "difficult-conversation",
    name: "Difficult conversation",
    criteria: [
      { id: "deescalation", label: "De-escalation", competency: "difficult_conversations", description: "Acknowledges emotion and repairs trust before arguing content." },
      { id: "listening", label: "Listening & diagnosis", competency: "client_management", description: "Asks open questions to find the real concern and reflects it back." },
      { id: "position", label: "Holding a position", competency: "difficult_conversations", description: "Stays anchored on facts without being defensive or caving." },
      { id: "outcome", label: "Outcome & next steps", competency: "client_management", description: "Leaves with a specific, agreed next step, owner and date." },
    ],
  },
  {
    id: "client-management",
    name: "Client management",
    criteria: [
      { id: "framing", label: "Framing", competency: "client_management", description: "Ties the conversation to the client's priorities and the engagement's goals." },
      { id: "options", label: "Options, not refusals", competency: "client_management", description: "Offers clear trade-offs instead of a flat yes or no." },
      { id: "clarity", label: "Clarity & brevity", competency: "output_quality", description: "Leads with the answer; speaks in plain, specific language." },
      { id: "outcome", label: "Outcome & next steps", competency: "client_management", description: "Leaves with a specific, agreed next step, owner and date." },
    ],
  },
  {
    id: "storyboard",
    name: "Storyline & ghost deck",
    criteria: [
      { id: "governing-thought", label: "Governing thought", competency: "problem_solving", description: "Answers the client's question with a clear, supported recommendation." },
      { id: "structure", label: "Structure (MECE)", competency: "storyboarding", description: "Key lines are mutually exclusive, collectively exhaustive and flow logically." },
      { id: "action-titles", label: "Action titles", competency: "storyboarding", description: "Titles are insights, 15 words or fewer, and tell the story when read alone." },
      { id: "evidence", label: "Evidence", competency: "output_quality", description: "Each slide's exhibit and chart type proves its title using the case data." },
    ],
  },
];

export const scenarios: Scenario[] = [
  {
    id: "savings-number-wrong",
    kind: "simulation",
    title: "Your savings number is wrong",
    summary: "The CFO has found a problem in your savings estimate nine days before her board meeting.",
    personaId: "margaret-chen",
    rubricId: "difficult-conversation",
    targetLevel: "consultant",
    difficulty: 2,
    durationMin: 15,
    competencies: ["difficult_conversations", "problem_solving"],
    briefing: {
      situation: "You are three weeks into a cost-reduction project at Northwind Retail. Your team's interim readout estimated $42M of savings. The CFO has asked for an urgent call.",
      yourRole: "Consultant leading the procurement workstream.",
      objective: "Keep the CFO's trust, understand the issue, and agree how the number will be reconciled before the board.",
      whatGoodLooksLike: {
        consultant: "Owns the issue without over-apologising, asks where the gap is, and agrees a joint reconciliation with FP&A and a date.",
        manager: "Also reframes the board message so the CFO is protected, and sets expectations on the range.",
      },
    },
    objectives: [
      { id: "acknowledge", label: "Acknowledged the concern" },
      { id: "diagnose", label: "Found the specific issue" },
      { id: "next-step", label: "Agreed reconciliation plan and date" },
    ],
    openingLine: "I'll be direct. My FP&A team thinks your $42 million is double-counting procurement. I'm presenting to the board in nine days. Explain.",
    maxTurns: 12,
  },
  {
    id: "leaked-findings",
    kind: "simulation",
    title: "The leaked findings",
    summary: "The COO heard from his CEO that your team thinks his operation is 20% overstaffed.",
    personaId: "david-okafor",
    rubricId: "difficult-conversation",
    targetLevel: "manager",
    difficulty: 3,
    durationMin: 15,
    competencies: ["difficult_conversations", "client_management"],
    briefing: {
      situation: "Helix Logistics operations review. Your interim finding — that operations are ~20% overstaffed versus peers — reached the COO through the CEO before your team briefed him.",
      yourRole: "Engagement manager.",
      objective: "Repair the relationship, understand his objections to the analysis, and agree how he will be involved going forward.",
      whatGoodLooksLike: {
        manager: "Apologises for the process failure first, explores what the benchmark misses, and gives him a real role in shaping the recommendation — without abandoning the finding.",
        director: "Also resets the governance so it can't happen again and aligns the CEO and COO on next steps.",
      },
    },
    objectives: [
      { id: "apologise", label: "Owned the process failure" },
      { id: "explore", label: "Explored his objections" },
      { id: "involve", label: "Agreed his role going forward" },
    ],
    openingLine: "I found out from my CEO that your team thinks my operations are 20% overstaffed. You didn't think to tell me first?",
    maxTurns: 12,
  },
  {
    id: "while-youre-here",
    kind: "simulation",
    title: "While you're here…",
    summary: "A friendly VP keeps adding scope to an already tight engagement.",
    personaId: "sofia-alvarez",
    rubricId: "client-management",
    targetLevel: "consultant",
    difficulty: 2,
    durationMin: 10,
    competencies: ["client_management"],
    briefing: {
      situation: "Brightwave Telecom churn diagnostic, week 4 of 6. The VP Strategy has asked for 'a quick look' at pricing for enterprise customers — a separate problem.",
      yourRole: "Consultant, day-to-day lead on the churn workstream.",
      objective: "Protect the core deliverable while keeping Sofia happy — offer options, not a flat no.",
      whatGoodLooksLike: {
        consultant: "Clarifies the ask, shows the trade-off against the churn deliverable, and offers options (swap, phase 2, escalate to the EM).",
        manager: "Also turns the ask into a potential phase 2 and aligns it to the CEO's priorities.",
      },
    },
    objectives: [
      { id: "clarify", label: "Clarified the new ask" },
      { id: "tradeoff", label: "Made the trade-off explicit" },
      { id: "agree", label: "Agreed an option" },
    ],
    openingLine: "Quick one! While you're here, could the team take a look at enterprise pricing too? Shouldn't take long — you've already got the data.",
    maxTurns: 10,
  },
  {
    id: "ten-minute-ceo",
    kind: "simulation",
    title: "The 10-minute CEO",
    summary: "The CEO has 10 minutes to hear your recommendation — and is already checking his phone.",
    personaId: "james-whitfield",
    rubricId: "client-management",
    targetLevel: "director",
    difficulty: 3,
    durationMin: 10,
    competencies: ["client_management", "output_quality"],
    briefing: {
      situation: "Arden Health growth strategy. You recommend exiting two low-margin clinic regions and reinvesting in outpatient diagnostics (+$60M EBITDA over 3 years).",
      yourRole: "Director / partner on the engagement.",
      objective: "Get the CEO to agree to take the recommendation to the board next month.",
      whatGoodLooksLike: {
        manager: "Leads with the answer and the decision needed; handles 'so what?' crisply.",
        director: "Also connects to his unspoken worries, anticipates board questions and secures a clear commitment.",
      },
    },
    objectives: [
      { id: "answer-first", label: "Led with the answer" },
      { id: "impact", label: "Quantified the impact" },
      { id: "commitment", label: "Secured a commitment" },
    ],
    openingLine: "I've got ten minutes. What do you need from me?",
    maxTurns: 8,
    isPro: true,
  },
  {
    id: "brightwave-churn",
    kind: "storyboard",
    title: "Brightwave Telecom: why is churn rising?",
    summary: "Turn a case pack into a governing thought, pyramid and ghost deck for the CEO.",
    rubricId: "storyboard",
    targetLevel: "consultant",
    difficulty: 2,
    durationMin: 45,
    competencies: ["storyboarding", "problem_solving", "output_quality"],
    briefing: {
      situation: "Brightwave's monthly churn rose from 1.8% to 2.2% over two quarters. The CEO wants the answer by Thursday.",
      yourRole: "Consultant building the storyline for the CEO readout.",
      objective: "Produce a governing thought, a 3–4 key-line pyramid and a 5–7 slide ghost deck.",
      whatGoodLooksLike: {
        analyst: "Clean slide-level action titles that match the right exhibits.",
        consultant: "A MECE pyramid with an insight-led governing thought and a deck the CEO can read from titles alone.",
        manager: "A crisp recommendation with quantified impact and a clear ask.",
      },
    },
    objectives: [],
    casePack: {
      client: "Brightwave Telecom",
      question: "Why has monthly churn risen from 1.8% to 2.2%, and what should we do about it?",
      exhibits: [
        { id: "E1", title: "Monthly churn by segment, last 6 quarters", kind: "table", data: "Segment | Q1 | Q2 | Q3 | Q4 | Q5 | Q6\nConsumer | 1.6% | 1.6% | 1.7% | 1.7% | 1.7% | 1.8%\nSMB | 2.1% | 2.2% | 2.6% | 3.3% | 3.9% | 4.3%\nEnterprise | 0.9% | 0.9% | 0.8% | 0.9% | 0.9% | 0.9%\nTotal | 1.8% | 1.8% | 1.9% | 2.0% | 2.1% | 2.2%" },
        { id: "E2", title: "NPS trend by segment", kind: "table", data: "Segment | Q1 | Q6\nConsumer | +21 | +19\nSMB | +12 | +4\nEnterprise | +30 | +31" },
        { id: "E3", title: "Competitor SMB bundle pricing (monthly)", kind: "table", data: "Provider | Broadband+Mobile bundle\nBrightwave | $189\nCompetitor A | $149 (launched Q3)\nCompetitor B | $165" },
        { id: "E4", title: "Call-centre average wait time (minutes)", kind: "table", data: "Q1 4.1 | Q2 4.3 | Q3 4.2 | Q4 4.4 | Q5 4.3 | Q6 4.2" },
        { id: "E5", title: "SMB churn by months since contract end", kind: "table", data: "In contract: 1.1% | 0–3 months out of contract: 6.8% | 3–12 months: 4.9% | 12+ months: 2.7%\nShare of SMB base out of contract: Q1 22% → Q6 41%" },
      ],
      interviews: [
        { id: "I1", who: "Head of SMB Sales", notes: "We stopped proactive renewal calls in Q3 to cut cost. Customers roll off contract and nobody talks to them. Competitor A's bundle is killing us on price." },
        { id: "I2", who: "Head of Customer Service", notes: "Wait times are flat. Complaints are mostly billing, not service. I don't think service is the churn driver." },
        { id: "I3", who: "CFO", notes: "A retention discount would cost us margin. I need to see payback before approving anything." },
      ],
      clientEmail: "From: CEO\nSubject: Churn\n\nThe board will ask why churn is up and what we're doing about it. I need the answer by Thursday — one page of headlines I can defend, then the backup.",
    },
    maxTurns: 0,
  },
];

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
    id: "decision-support",
    name: "Decision support",
    criteria: [
      { id: "framing", label: "Decision framing", competency: "problem_solving", description: "States the decision needed, the options and the criteria up front." },
      { id: "tradeoffs", label: "Options and trade-offs", competency: "problem_solving", description: "Quantifies the options in £, time and risk, and is honest about the downsides of the recommendation." },
      { id: "recommendation", label: "Clear recommendation", competency: "output_quality", description: "Gives one clear recommendation early, in plain business language rather than technology jargon." },
      { id: "commitment", label: "Commitment & next steps", competency: "client_management", description: "Secures a decision or a dated path to one, with owners." },
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

/** Scenarios from earlier versions of the catalogue. Kept in the database for history, hidden from users. */
export const retiredScenarioIds = ["savings-number-wrong", "leaked-findings", "while-youre-here", "brightwave-churn"];

export const scenarios: Scenario[] = [
  // ---------- Enterprise technology ----------
  {
    id: "cloud-bill-shock",
    kind: "simulation",
    practiceArea: "enterprise_technology",
    title: "The cloud bill shock",
    summary: "The CIO's cloud run costs are 41% over the business case you helped write, and the CFO wants answers.",
    personaId: "graham-holt",
    rubricId: "difficult-conversation",
    targetLevel: "manager",
    difficulty: 3,
    durationMin: 15,
    competencies: ["difficult_conversations", "problem_solving"],
    briefing: {
      situation:
        "Northgate Building Society moved its core workloads to the public cloud nine months ago, with your firm as design partner. The business case assumed £4.3m a year in cloud run costs; the current run rate is £6.1m. The CFO has asked the CIO to explain the gap by the end of the month.",
      yourRole: "Engagement manager for the cloud migration design work.",
      objective: "Own your firm's part, break the overspend into causes the CIO can explain, and agree a cost-down plan with dates.",
      whatGoodLooksLike: {
        consultant: "Stays calm, separates causes (no rightsizing, duplicate running, data egress) and agrees a joint review with dates.",
        manager: "Owns the business case assumptions your firm got wrong, quantifies each cause in £, and gives the CIO a dated FinOps plan he can take to the CFO.",
        director: "Also reframes the story for the CFO and board risk committee, and positions a value-based follow-on without looking self-serving.",
      },
    },
    objectives: [
      { id: "own", label: "Owned the firm's part of the gap" },
      { id: "causes", label: "Broke the overspend into causes" },
      { id: "plan", label: "Agreed a dated cost-down plan" },
    ],
    openingLine: "Your business case said £4.3 million a year to run this. We're at £6.1 million. The CFO wants an explanation by month-end, so — explain it to me first.",
    maxTurns: 12,
  },

  // ---------- Data & AI ----------
  {
    id: "genai-pilot-not-ready",
    kind: "simulation",
    practiceArea: "data_ai",
    title: "The pilot isn't ready",
    summary: "The CDO wants to tell the board next week that the GenAI claims assistant is ready to scale. Your evaluation says it isn't.",
    personaId: "amara-osei",
    rubricId: "difficult-conversation",
    targetLevel: "consultant",
    difficulty: 2,
    durationMin: 15,
    competencies: ["difficult_conversations", "client_management"],
    briefing: {
      situation:
        "Meridian Insurance has piloted a GenAI assistant that triages motor claims. Your evaluation found 81% routing accuracy against a 90% target, weaker performance on claims from vulnerable customers (a Consumer Duty concern), and the data protection impact assessment (DPIA) is not yet signed off. The CDO wants to announce scaling at next week's board.",
      yourRole: "Consultant who led the pilot evaluation.",
      objective: "Deliver the bad news clearly, protect the CDO with her board, and agree a gated path to scale.",
      whatGoodLooksLike: {
        consultant: "Leads with the finding and the evidence, acknowledges her ambition, and proposes a gated plan with clear criteria and dates.",
        manager: "Also gives her a board message that shows momentum without overclaiming, and lines up the Chief Risk Officer and DPO.",
      },
    },
    objectives: [
      { id: "finding", label: "Stated the finding clearly" },
      { id: "evidence", label: "Backed it with specific evidence" },
      { id: "path", label: "Agreed a gated path to scale" },
    ],
    openingLine: "I've seen the headline — 81%. That's basically there. I want to tell the board next week we're scaling to all motor claims. You're not going to tell me otherwise, are you?",
    maxTurns: 12,
  },
  {
    id: "bad-data-extract",
    kind: "simulation",
    practiceArea: "data_ai",
    title: "That's all you're getting",
    summary: "You need customer-level complaints data. The client's MI lead sent an aggregated extract and cited GDPR.",
    personaId: "gareth-lloyd",
    rubricId: "client-management",
    targetLevel: "analyst",
    difficulty: 1,
    durationMin: 10,
    competencies: ["client_management", "problem_solving"],
    briefing: {
      situation:
        "You're analysing why complaints at Calder Water rose 23% last year. You asked for complaint records at customer level; the Head of MI sent a monthly summary with 30% of categories marked 'Other', and said customer-level data can't be shared because of GDPR.",
      yourRole: "Analyst on the customer service diagnostic.",
      objective: "Explain what the analysis needs and why, propose a compliant way to get it, and agree what will be shared and when.",
      whatGoodLooksLike: {
        analyst: "Explains the need in plain terms, suggests a compliant route (pseudonymised fields, minimum data, DPO sign-off), and agrees a date.",
        consultant: "Also offers to take work off his team and links the request to the outcome his directors care about.",
      },
    },
    objectives: [
      { id: "why", label: "Explained why the detail matters" },
      { id: "compliant", label: "Proposed a compliant route" },
      { id: "agreed", label: "Agreed what will be shared and when" },
    ],
    openingLine: "I sent you what we can share. Customer-level data's a GDPR problem, and to be honest my team hasn't got time to cut it another way.",
    maxTurns: 10,
  },

  // ---------- Programme delivery ----------
  {
    id: "watermelon-status",
    kind: "simulation",
    practiceArea: "programme_delivery",
    title: "Green on the outside",
    summary: "The Programme Director wants to report Amber to tomorrow's SteerCo. Your PMO analysis says Red.",
    personaId: "mark-bennett",
    rubricId: "difficult-conversation",
    targetLevel: "manager",
    difficulty: 3,
    durationMin: 15,
    competencies: ["difficult_conversations", "client_management"],
    briefing: {
      situation:
        "Calder Water is replacing its ERP and field-service systems ahead of the AMP8 regulatory period. Go-live is in 11 weeks. Data migration mock load 2 failed reconciliation, only 38% of test scripts have run against a plan of 70%, and the system integrator is short of migration staff. The Programme Director wants to report Amber at tomorrow's SteerCo.",
      yourRole: "Engagement manager running the programme management office (PMO).",
      objective: "Hold an honest status without humiliating him, and agree a recovery plan he can own at the SteerCo.",
      whatGoodLooksLike: {
        manager: "Acknowledges the pressure, keeps to the facts on Red, and helps him turn it into a recovery plan with options he presents himself.",
        director: "Also aligns the SRO before the meeting and frames the decision the SteerCo needs to make (date, scope or resource).",
      },
    },
    objectives: [
      { id: "acknowledge", label: "Acknowledged his position" },
      { id: "red", label: "Held the Red status on the facts" },
      { id: "recovery", label: "Agreed a recovery plan he will present" },
    ],
    openingLine: "Look, I know the numbers. But if we go in Red tomorrow, it's an executive review and we lose two weeks to slide-making. Let's call it Amber with a plan. It'll come good.",
    maxTurns: 12,
  },
  {
    id: "scope-creep-crm",
    kind: "simulation",
    practiceArea: "programme_delivery",
    title: "While you're here…",
    summary: "Sprint 9 of 14 on a CRM programme, and the Director of Digital wants to add an AI chatbot to the scope.",
    personaId: "sofia-alvarez",
    rubricId: "client-management",
    targetLevel: "consultant",
    difficulty: 2,
    durationMin: 10,
    competencies: ["client_management"],
    briefing: {
      situation:
        "Brightwave Telecom is replacing its contact-centre CRM. You're in sprint 9 of 14 with a fixed release date and budget. The Director of Digital has asked the team to 'quickly' add a GenAI chatbot for customers to the scope.",
      yourRole: "Consultant, delivery lead for the CRM workstream.",
      objective: "Protect the release while keeping Sofia on side — offer options, not a flat no.",
      whatGoodLooksLike: {
        consultant: "Clarifies the ask, shows the impact on the release plan, and offers options (swap scope, phase 2, change request).",
        manager: "Also links the chatbot to the CEO's call-volume target and shapes it into a funded phase 2.",
      },
    },
    objectives: [
      { id: "clarify", label: "Clarified the new ask" },
      { id: "tradeoff", label: "Made the impact on the release explicit" },
      { id: "agree", label: "Agreed an option" },
    ],
    openingLine: "Quick one! While you're in there, could the team add a little AI chatbot for customers? Shouldn't take long — the data's all in the new CRM anyway.",
    maxTurns: 10,
  },

  // ---------- Change & culture ----------
  {
    id: "operating-model-leak",
    kind: "simulation",
    practiceArea: "change_culture",
    title: "The leaked operating model",
    summary: "The Director of Operations saw your draft operating model on a staff WhatsApp group before anyone briefed him.",
    personaId: "david-okafor",
    rubricId: "difficult-conversation",
    targetLevel: "manager",
    difficulty: 3,
    durationMin: 15,
    competencies: ["difficult_conversations", "client_management"],
    briefing: {
      situation:
        "Harbour Homes, a housing association with 40,000 homes, is moving to a digital-first operating model. Your draft design moves repairs reporting online and reduces area-office roles by 18%. A screenshot of the draft reached the Director of Housing Operations through a staff WhatsApp group before your team had briefed him. Union consultation hasn't started.",
      yourRole: "Engagement manager on the operating model redesign.",
      objective: "Repair the relationship, understand what the design misses, and agree his role in shaping how the change lands.",
      whatGoodLooksLike: {
        manager: "Apologises for the process failure first, explores what the design gets wrong for his tenants and staff, and gives him a real role — without abandoning the case for change.",
        director: "Also resets the governance with the Chief Executive and plans the staff and union communication properly.",
      },
    },
    objectives: [
      { id: "apologise", label: "Owned the process failure" },
      { id: "explore", label: "Explored what the design misses" },
      { id: "involve", label: "Agreed his role in the change" },
    ],
    openingLine: "I found out my teams are being cut from a WhatsApp screenshot. A WhatsApp screenshot. You didn't think to talk to me first?",
    maxTurns: 12,
  },

  // ---------- Commercial advisory & decision support ----------
  {
    id: "benefits-case-challenge",
    kind: "simulation",
    practiceArea: "commercial_advisory",
    title: "Your benefits case is wrong",
    summary: "The CFO's team has found a double count in your £9.5m-a-year benefits case, nine days before the investment committee.",
    personaId: "margaret-chen",
    rubricId: "difficult-conversation",
    targetLevel: "consultant",
    difficulty: 2,
    durationMin: 15,
    competencies: ["difficult_conversations", "problem_solving"],
    briefing: {
      situation:
        "Northwind Retail is asking its investment committee to approve a £24m ERP and supply-chain platform. Your team's business case shows £9.5m a year of benefits. The CFO's FP&A team believes the £3.1m inventory benefit has been counted twice — once as working capital and once in the P&L. The committee meets in nine days.",
      yourRole: "Consultant who built the benefits model.",
      objective: "Keep the CFO's trust, find the specific issue, and agree how the case will be corrected before the committee.",
      whatGoodLooksLike: {
        consultant: "Owns the issue without over-apologising, checks exactly where the double count is, and agrees a joint reconciliation with FP&A and a date.",
        manager: "Also reframes the committee message so the CFO is protected, and resets the case honestly (payback and range).",
      },
    },
    objectives: [
      { id: "acknowledge", label: "Acknowledged the concern" },
      { id: "diagnose", label: "Found the specific issue" },
      { id: "next-step", label: "Agreed a correction plan and date" },
    ],
    openingLine: "I'll be direct. My FP&A team says your £9.5 million counts the inventory benefit twice. I'm in front of the investment committee in nine days. Explain.",
    maxTurns: 12,
  },
  {
    id: "ten-minute-ceo",
    kind: "simulation",
    practiceArea: "commercial_advisory",
    title: "The 10-minute CEO",
    summary: "The Chief Executive has ten minutes to decide whether to replace the patient administration system — and is checking his phone.",
    personaId: "james-whitfield",
    rubricId: "decision-support",
    targetLevel: "director",
    difficulty: 3,
    durationMin: 10,
    competencies: ["client_management", "output_quality"],
    briefing: {
      situation:
        "Arden Health, a UK private hospital group, runs a 15-year-old patient administration system that failed for six hours last month. The options: extend the legacy system (£3m over two years, risk stays), move to a SaaS electronic patient record (£18m over five years, about £5m a year of benefits from 2028), or build (ruled out). You recommend a phased SaaS move starting with outpatients.",
      yourRole: "Director on the technology strategy engagement.",
      objective: "Get the Chief Executive to agree to take the SaaS recommendation to the board next month.",
      whatGoodLooksLike: {
        manager: "Leads with the recommendation and the decision needed; handles 'so what?' crisply in £ and risk.",
        director: "Also connects to his owners' EBITDA goals and the CQC risk, anticipates board questions and secures a clear commitment.",
      },
    },
    objectives: [
      { id: "answer-first", label: "Led with the recommendation" },
      { id: "impact", label: "Quantified cost, benefit and risk" },
      { id: "commitment", label: "Secured a commitment" },
    ],
    openingLine: "I've got ten minutes. You want me to spend eighteen million on software. Why?",
    maxTurns: 8,
  },

  // ---------- Storyboard cases ----------
  {
    id: "meridian-data-platform",
    kind: "storyboard",
    practiceArea: "data_ai",
    title: "Meridian Insurance: why hasn't the £14m data platform delivered?",
    summary: "Turn a case pack into a governing thought, pyramid and ghost deck for the COO and board.",
    rubricId: "storyboard",
    targetLevel: "consultant",
    difficulty: 2,
    durationMin: 45,
    competencies: ["storyboarding", "problem_solving", "output_quality"],
    briefing: {
      situation:
        "Meridian Insurance has spent £14m over three years on a cloud data platform. Only 3 of 20 planned use cases are live and the board is asking whether to keep funding it. The COO wants the answer before Thursday's board.",
      yourRole: "Consultant building the storyline for the COO's board paper.",
      objective: "Produce a governing thought, a 3–4 key-line pyramid and a 5–7 slide ghost deck.",
      whatGoodLooksLike: {
        analyst: "Clean slide-level action titles that match the right exhibits.",
        consultant: "A MECE pyramid with an insight-led governing thought and a deck the board can read from titles alone.",
        manager: "A crisp recommendation on funding with quantified value and a clear ask.",
      },
    },
    objectives: [],
    casePack: {
      client: "Meridian Insurance",
      question: "Why has the £14m data platform delivered so little value, and should the board keep funding it?",
      exhibits: [
        { id: "E1", title: "Data platform spend by year (£m)", kind: "table", data: "Year | Platform & licences | Engineering | Use-case delivery\nFY23 | 1.9 | 2.0 | 0.2\nFY24 | 2.1 | 2.4 | 0.4\nFY25 | 2.2 | 2.4 | 0.4" },
        { id: "E2", title: "Planned use cases by status", kind: "table", data: "Status | Use cases\nLive | 3\nIn build | 4\nBlocked: data quality | 8\nBlocked: no business owner | 5" },
        { id: "E3", title: "Data quality score by domain (target 90%)", kind: "table", data: "Domain | Score\nPolicy | 93%\nClaims | 71%\nCustomer | 64%\nBroker | 58%" },
        { id: "E4", title: "Weekly active users (of 400 licensed)", kind: "table", data: "Q1 42 | Q2 55 | Q3 61 | Q4 58" },
        { id: "E5", title: "Annual value from live use cases (£m)", kind: "table", data: "Use case | Value\nPricing refresh | 1.2\nFraud flags | 0.8\nBroker dashboard | 0.1\nBusiness case target | 6.5" },
      ],
      interviews: [
        { id: "I1", who: "Chief Data Officer", notes: "The platform is genuinely best in class. The business just won't adopt it — they keep going back to their spreadsheets." },
        { id: "I2", who: "Head of Claims", notes: "Nobody asked us what we needed. Our handlers type claim details as free text, so of course the data is a mess. We were told the platform would fix that." },
        { id: "I3", who: "Head of Data Engineering", notes: "Eighty per cent of my team's time goes on fixing broken pipelines. There's no named owner for claims or customer data in the business, so problems never get fixed at source." },
      ],
      clientEmail:
        "From: COO\nSubject: Data platform — board paper\n\nThe board will ask why £14m hasn't delivered and whether we keep funding it. I need the answer before Thursday — one page of headlines I can defend, then the backup.",
    },
    maxTurns: 0,
  },
  {
    id: "calder-managed-services",
    kind: "storyboard",
    practiceArea: "commercial_advisory",
    title: "Calder Water: renew, re-tender or insource IT services?",
    summary: "Build the recommendation for the CFO's board paper on an £11.2m-a-year managed-services contract.",
    rubricId: "storyboard",
    targetLevel: "manager",
    difficulty: 3,
    durationMin: 45,
    competencies: ["storyboarding", "problem_solving", "output_quality"],
    briefing: {
      situation:
        "Calder Water's IT managed-services contract — £11.2m a year — ends in 14 months. The supplier is missing key service levels. The board must choose: renew, re-tender, or bring the service in-house. The CFO wants a recommendation in two weeks.",
      yourRole: "Manager leading the sourcing options appraisal.",
      objective: "Produce a governing thought, a 3–4 key-line pyramid and a 5–7 slide ghost deck that drives a board decision.",
      whatGoodLooksLike: {
        consultant: "A MECE comparison of the options with clear action titles and the right exhibits.",
        manager: "One clear recommendation, quantified over five years in £, with the risks of each option and the timeline to decide.",
        director: "Also frames the decision for the board, including what they must approve now and what triggers a rethink.",
      },
    },
    objectives: [],
    casePack: {
      client: "Calder Water",
      question: "Should Calder Water renew, re-tender or insource its IT managed services when the contract ends in 14 months?",
      exhibits: [
        { id: "E1", title: "Five-year cost of each option (£m)", kind: "table", data: "Option | One-off | Annual run | 5-year total\nRenew as-is | 0.0 | 11.2 | 56.0\nRe-tender | 2.4 | 9.1 | 47.9\nInsource | 6.8 | 8.6 | 49.8" },
        { id: "E2", title: "Service levels, last 12 months", kind: "table", data: "Measure | Target | Actual\nP1 incidents fixed in 4 hours | 95% | 81%\nService desk first-time fix | 70% | 62%\nChange success rate | 95% | 96%" },
        { id: "E3", title: "Market benchmark for comparable scope (£m a year)", kind: "table", data: "Benchmark | Annual cost\nLower quartile | 8.4\nMedian | 9.3\nCalder today | 11.2" },
        { id: "E4", title: "Insourcing capability gap", kind: "table", data: "Measure | Value\nRoles needed | 64\nIn-house today | 18\nTime to hire (months) | 9–12" },
        { id: "E5", title: "Re-tender timeline (months)", kind: "table", data: "Stage | Months\nMarket engagement | 2\nProcurement (Find a Tender) | 5\nTransition | 6\nTotal | 13" },
      ],
      interviews: [
        { id: "I1", who: "Chief Information Officer", notes: "The partner model works for us — we just have the wrong partner and a contract with no teeth. I don't want to run a 64-person IT operation." },
        { id: "I2", who: "Head of Procurement", notes: "Market interest is strong: five suppliers responded to early engagement. We'd need to start formally within two months to finish before the contract ends." },
        { id: "I3", who: "HR Director", notes: "Hiring 46 technology roles in this market, in Yorkshire, inside a year? That's a big ask. TUPE would help with some of them." },
      ],
      clientEmail:
        "From: CFO\nSubject: IT services contract\n\nI need a recommendation for the board in two weeks: renew, re-tender or insource. One page I can defend, then the backup.",
    },
    maxTurns: 0,
  },
];

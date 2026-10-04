/**
 * Interview assessment pack: a timed, four-section exercise on one UK
 * technology & transformation case. Candidates never see this file's
 * assessor-only fields (planted error, scoring notes).
 */
import type { CasePack, PersonaBrief } from "@/lib/types";

export type InterviewSectionKind = "critical_thinking" | "ai_analysis" | "client_conversation" | "reflection";

export interface InterviewQuestion {
  id: string;
  prompt: string;
  /** Soft limit shown to the candidate. */
  maxWords: number;
}

export interface InterviewSection {
  id: string;
  kind: InterviewSectionKind;
  title: string;
  durationMin: number;
  /** What the candidate sees before starting the section. */
  instructions: string[];
  /** Whether the AI assistant is available in this section. Enforced server-side. */
  aiAssistant: boolean;
  questions: InterviewQuestion[];
  /** Client conversation sections only. */
  maxTurns?: number;
}

export interface AssessmentPack {
  id: string;
  title: string;
  summary: string;
  totalMin: number;
  casePack: CasePack;
  sections: InterviewSection[];
  persona: { id: string; name: string; title: string; company: string; personality: string; brief: PersonaBrief; openingLine: string };
  /** The AI pre-read shown at the start of the AI section. Contains one deliberate error (see plantedError). */
  aiPreRead: string;
  /** Assessor-only: what the pre-read gets wrong and the correct figure. Used in scoring. */
  plantedError: { description: string; wrong: string; correct: string };
  /** Assessor-only notes that calibrate the scorer. */
  scoringNotes: string;
}

export const kestrelPack: AssessmentPack = {
  id: "kestrel-ai-service",
  title: "Kestrel Energy: AI in customer service",
  summary: "A 60-minute timed exercise testing critical thinking, communication and the judgement to use AI well, on a UK energy retailer's customer service transformation.",
  totalMin: 60,
  casePack: {
    client: "Kestrel Energy",
    question:
      "Kestrel Energy, a UK energy retailer with 1.8 million customers, must cut customer service costs by at least £5m a year without worsening complaints. Should it scale AI in its contact centres, offshore part of its phone service, or do neither — and how?",
    exhibits: [
      {
        id: "E1",
        title: "Customer contacts and cost by channel (last 12 months)",
        kind: "table",
        data: "Channel | Contacts (m) | Cost per contact | Annual cost (£m)\nPhone | 3.84 | £5.80 | 22.3\nWeb chat | 1.43 | £3.10 | 4.4\nSelf-service | 0.93 | £0.40 | 0.4\nTotal | 6.20 | | 27.1",
      },
      {
        id: "E2",
        title: "Why customers call (share of phone contacts)",
        kind: "table",
        data: "Reason | Share\nBilling query or dispute | 38%\nMeter readings | 17%\nPayment plans and debt | 14%\nMoving home | 11%\nTariff changes | 9%\nOther | 11%",
      },
      {
        id: "E3",
        title: "AI agent-assist pilot (120 agents, 12 weeks)",
        kind: "table",
        data: "Measure | Pilot | Control\nAverage handle time (minutes) | 6.9 | 8.0\nAI suggestions accepted by agents | 92% | –\nSuggestions wrong on billing queries | 11% | –\nCustomer satisfaction (CSAT) | 78% | 77%\nRepeat contacts within 7 days | 19% | 18%",
      },
      {
        id: "E4",
        title: "Complaints",
        kind: "table",
        data: "Measure | Last year | This year\nComplaints per 100,000 customers (Ofgem measure) | 1,410 | 1,664\nShare of complaints about billing | 33% | 38%\nComplaints from customers flagged as vulnerable | 12% | 15%",
      },
      {
        id: "E5",
        title: "Options under consideration (vendor and internal estimates)",
        kind: "table",
        data: "Option | One-off cost (£m) | Annual run cost (£m) | Estimated annual saving (£m)\nScale AI agent assist to all 1,100 agents | 2.5 | 1.2 | 3.1\nAdd GenAI self-service for meter readings and moving home | 1.8 | 0.9 | 3.4\nOffshore 40% of phone volume | 4.0 | 0.6 | 5.2",
      },
      {
        id: "E6",
        title: "Workforce",
        kind: "table",
        data: "Measure | Value\nContact-centre agents | 1,100\nAnnual staff turnover | 31%\nRecognised union | GMB\nSites | Sheffield, Swansea",
      },
    ],
    interviews: [
      { id: "I1", who: "Chief Customer Officer", notes: "Billing is where we hurt customers. If AI gets a billing answer wrong for a vulnerable customer, that's an Ofgem problem and a front-page problem." },
      { id: "I2", who: "CFO", notes: "I need £5m a year of savings from next year's budget. Offshoring is the only option that clearly gets there on its own." },
      { id: "I3", who: "Head of Contact Centres", notes: "Turnover is 31%, so we can reduce headcount without redundancies if we're patient. Agents liked the AI pilot — when it was right." },
      { id: "I4", who: "GMB regional organiser (via HR)", notes: "We'll fight offshoring. We'd work with an AI programme if it's about better jobs, not fewer of them overnight." },
    ],
    clientEmail:
      "From: CEO\nSubject: Customer service — your recommendation\n\nI need a recommendation I can take to the board: how we save £5m a year in customer service without making complaints worse. One page, with the numbers and the risks.",
  },
  sections: [
    {
      id: "s1",
      kind: "critical_thinking",
      title: "Read and frame the problem",
      durationMin: 15,
      aiAssistant: false,
      instructions: [
        "Read the case pack: the brief, six exhibits, interview notes and the CEO's email.",
        "Answer the three questions in your own words. No AI assistant is available in this section.",
        "Be specific and use the numbers. Short, sharp answers score better than long ones.",
      ],
      questions: [
        { id: "q1", prompt: "In no more than two sentences, what is the real problem Kestrel needs to solve?", maxWords: 60 },
        { id: "q2", prompt: "What is your initial hypothesis for the answer, and what three things must be true for it to be right?", maxWords: 150 },
        { id: "q3", prompt: "Which figure or claim in the pack do you trust least, why, and what would you ask for to check it?", maxWords: 100 },
      ],
    },
    {
      id: "s2",
      kind: "ai_analysis",
      title: "Analyse with an AI assistant",
      durationMin: 20,
      aiAssistant: true,
      instructions: [
        "Write a recommendation memo to the CEO (no more than 300 words): your recommendation, the five-year numbers, the main risks and a 90-day plan.",
        "You have an AI assistant for this section only. It can explain exhibits, run calculations, check your reasoning and critique your drafts. It won't write the memo for you.",
        "Like any AI tool, the assistant can be wrong. You are responsible for checking anything you use.",
        "Everything you send the assistant is recorded and forms part of your assessment.",
      ],
      questions: [{ id: "memo", prompt: "Your recommendation memo to the CEO", maxWords: 300 }],
    },
    {
      id: "s3",
      kind: "client_conversation",
      title: "Defend it to the client",
      durationMin: 10,
      aiAssistant: false,
      maxTurns: 8,
      instructions: [
        "You're meeting Rachel Doyle, Kestrel's Chief Customer Officer, to talk through your recommendation.",
        "She has read your memo. Respond as you would in a real client meeting. No AI assistant is available.",
        "You have up to 8 replies. The conversation ends when the time runs out or you've used your replies.",
      ],
      questions: [],
    },
    {
      id: "s4",
      kind: "reflection",
      title: "Reflect",
      durationMin: 5,
      aiAssistant: false,
      instructions: ["Answer honestly — there is no single right answer. No AI assistant is available."],
      questions: [
        {
          id: "r1",
          prompt: "How did you use the AI assistant, what did you check before relying on it, and what would you not trust it with on a real engagement?",
          maxWords: 150,
        },
      ],
    },
  ],
  persona: {
    id: "rachel-doyle",
    name: "Rachel Doyle",
    title: "Chief Customer Officer",
    company: "Kestrel Energy",
    personality: "Sharp, customer-first and sceptical of consultants who oversell AI. Under pressure from Ofgem on complaints.",
    openingLine: "I've read your memo. Before we go any further — what happens when your AI gives a vulnerable customer the wrong answer about their bill?",
    brief: {
      motivations: [
        "Get complaints down, especially on billing and from vulnerable customers",
        "Avoid a fight with the GMB that disrupts service",
        "Not be the executive who signed off an AI failure",
      ],
      triggers: [
        "Overclaiming what AI can do or ignoring the 11% billing error rate",
        "Savings figures that don't add up",
        "Dismissing the union or staff concerns",
      ],
      trustBuilders: [
        "Acknowledging the billing risk and proposing specific safeguards (human review, start with low-risk contact types)",
        "Numbers that reconcile to the exhibits",
        "A phased plan with clear measures and a way to stop if complaints rise",
      ],
      speakingStyle: "Direct, warm but probing. Asks 'how would that work on a Monday morning?'",
      privateFacts: [
        "The board wants the £5m but she has a veto on anything that touches vulnerable customers",
        "She would back AI self-service for meter readings and moving home if billing is kept with humans at first",
      ],
    },
  },
  aiPreRead: [
    "AI pre-read: Kestrel Energy case summary (auto-generated)",
    "",
    "• Kestrel spends about £27.1m a year on customer contacts; phone is 62% of contacts and £22.3m of the cost.",
    "• Billing queries are the biggest reason customers call (38% of phone contacts) and the fastest-growing complaint area (38% of complaints).",
    "• The agent-assist pilot cut average handle time by 41%. Applied to all phone contacts, that is worth roughly £9m a year — enough on its own to hit the £5m target.",
    "• AI suggestions on billing queries were wrong 11% of the time; customer satisfaction and repeat contacts were broadly flat.",
    "• Offshoring 40% of phone volume is estimated to save £5.2m a year but would be opposed by the GMB.",
  ].join("\n"),
  plantedError: {
    description:
      "The pre-read says the pilot cut handle time by 41% (worth about £9m a year). Exhibit E3 shows 8.0 → 6.9 minutes, a 14% cut, and E5 values scaling agent assist at £3.1m a year.",
    wrong: "41% handle-time reduction, ~£9m a year",
    correct: "14% handle-time reduction (8.0 → 6.9 minutes), ~£3.1m a year",
  },
  scoringNotes: [
    "Strong answers see that no single option safely delivers £5m without risk: agent assist alone is ~£3.1m a year; self-service for meter readings and moving home adds ~£3.4m and avoids the riskiest (billing) contacts; offshoring reaches £5.2m but carries union, complaints and Ofgem risk.",
    "A good recommendation combines GenAI self-service for low-risk contact types with agent assist, keeps billing (and vulnerable customers) with humans plus safeguards until the billing error rate falls, uses 31% turnover to avoid redundancies, and phases with stop/go measures on complaints.",
    "Five-year view (indicative): agent assist 5 × (3.1 − 1.2) − 2.5 = £7.0m net; self-service 5 × (3.4 − 0.9) − 1.8 = £10.7m net; offshore 5 × (5.2 − 0.6) − 4.0 = £19.0m net before risk. Candidates who confuse gross saving with net (ignoring run costs) should be marked down on commercial judgement.",
    "Treat the 11% billing error rate, the rise in vulnerable-customer complaints, and the CFO's single-option framing as things a strong candidate challenges.",
  ].join("\n"),
};

export const assessmentPacks = [kestrelPack];

export function getPack(id: string) {
  return assessmentPacks.find((p) => p.id === id) ?? null;
}

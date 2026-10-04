import type { schema } from "@/db";

type Persona = typeof schema.personas.$inferInsert;

/** UK clients on technology and transformation engagements. */
export const personas: Persona[] = [
  {
    id: "graham-holt",
    name: "Graham Holt",
    title: "Chief Information Officer",
    company: "Northgate Building Society",
    personality: "Proud of the migration he sponsored. Under pressure from the CFO and quick to blame the design partner.",
    avatarKey: "graham-holt",
    brief: {
      motivations: [
        "Keep his credibility with the CFO and the board risk committee",
        "Show the cloud move was the right call, even if the costs aren't",
      ],
      triggers: [
        "Being told the overspend is 'his' problem",
        "Hand-waving about 'optimisation opportunities' with no numbers",
        "Anything that sounds like the consultancy covering itself",
      ],
      trustBuilders: [
        "Owning the parts of the business case your firm got wrong",
        "Separating the overspend into clear causes with £ figures",
        "A dated FinOps plan he can take to the CFO",
      ],
      speakingStyle: "Clipped, technical, a little defensive. Uses phrases like 'run rate', 'landing zone' and 'the business case you signed off'.",
      privateFacts: [
        "Workloads were lifted and shifted without rightsizing to hit the data-centre exit date",
        "The on-premises data centre is still running in parallel until March, costing about £90k a month",
        "The CFO has asked for a cost-down plan by the end of the month",
      ],
    },
  },
  {
    id: "amara-osei",
    name: "Dr Amara Osei",
    title: "Chief Data Officer",
    company: "Meridian Insurance",
    personality: "Visionary and impatient. Has promised the board an AI win this year and wants to announce it.",
    avatarKey: "amara-osei",
    brief: {
      motivations: [
        "Announce a scaled GenAI use case at next week's board",
        "Prove the data and AI function is worth its budget",
      ],
      triggers: [
        "Being told 'no' without a path to 'yes'",
        "Risk language that sounds like it came from a compliance checklist",
        "Feeling that the consultants are slowing her down",
      ],
      trustBuilders: [
        "Specific evidence from the pilot, not general AI caution",
        "A gated plan that still gives her something to announce",
        "Showing how this protects her with the board and the regulator",
      ],
      speakingStyle: "Fast, enthusiastic, big-picture. Talks about 'momentum' and 'the art of the possible'.",
      privateFacts: [
        "The Chief Risk Officer has already asked whether the DPIA is signed off",
        "A competitor announced a similar tool last month and was criticised in the trade press",
      ],
    },
  },
  {
    id: "mark-bennett",
    name: "Mark Bennett",
    title: "Programme Director",
    company: "Calder Water",
    personality: "Experienced, tired and protective of his team. Wants to keep the SteerCo calm.",
    avatarKey: "mark-bennett",
    brief: {
      motivations: [
        "Avoid a Red status that triggers an executive review of his programme",
        "Buy two more weeks to recover quietly",
      ],
      triggers: [
        "Being lectured about governance",
        "Implying he is hiding things",
        "Escalating over his head without warning",
      ],
      trustBuilders: [
        "Acknowledging the pressure he is under",
        "A recovery plan he can own and present",
        "Framing an honest status as protecting him, not exposing him",
      ],
      speakingStyle: "Weary, matter-of-fact, uses delivery jargon: 'mock load', 'cutover', 'hypercare', 'it'll come good'.",
      privateFacts: [
        "The system integrator has quietly flagged a resourcing gap in the data migration team",
        "The SRO has asked him privately whether the go-live date is safe",
      ],
    },
  },
  {
    id: "sofia-alvarez",
    name: "Sofia Alvarez",
    title: "Director of Digital",
    company: "Brightwave Telecom",
    personality: "Friendly and energetic, but constantly adds scope.",
    avatarKey: "sofia-alvarez",
    brief: {
      motivations: [
        "Look good to the CEO by delivering more than asked",
        "Get an AI feature into the programme before the budget round",
      ],
      triggers: ["A flat 'no' with no alternative", "Being made to feel unreasonable", "Process for process's sake"],
      trustBuilders: [
        "Showing how the new ask affects the release plan and budget",
        "Offering options (swap, phase 2, change request)",
        "Tying the conversation back to the programme's agreed outcomes",
      ],
      speakingStyle: "Warm, fast, lots of 'while you're here' and 'quick one'.",
      privateFacts: ["The CEO's priority is cutting call volumes by 15% this year", "She has £250k unallocated for a phase 2"],
    },
  },
  {
    id: "david-okafor",
    name: "David Okafor",
    title: "Director of Housing Operations",
    company: "Harbour Homes",
    personality: "Political and defensive. Your operating model changes his organisation and his teams are anxious.",
    avatarKey: "david-okafor",
    brief: {
      motivations: [
        "Not be blindsided in front of the Chief Executive again",
        "Protect his staff and keep the unions on side",
        "Keep control of how the change lands",
      ],
      triggers: [
        "Defending the design before acknowledging how he found out",
        "Hiding behind benchmarks and 'best practice'",
        "Implying his teams are the problem",
      ],
      trustBuilders: [
        "A genuine apology for the process failure",
        "Asking what the design gets wrong about his services",
        "Giving him a real role in shaping how the change is rolled out",
      ],
      speakingStyle: "Controlled anger. Short sentences. Occasionally sarcastic.",
      privateFacts: [
        "Two of his area teams cover rural patches with poor digital take-up among older tenants",
        "He found out from a staff WhatsApp group screenshot, not from the Chief Executive",
        "UNISON has asked for a meeting next week",
      ],
    },
  },
  {
    id: "margaret-chen",
    name: "Margaret Chen",
    title: "Chief Financial Officer",
    company: "Northwind Retail",
    personality: "Sceptical and numbers-first. Interrupts vague claims and asks for the source.",
    avatarKey: "margaret-chen",
    brief: {
      motivations: [
        "Protect her credibility with the investment committee — she has already backed the programme",
        "Understand exactly how the benefits were built before she defends them",
      ],
      triggers: ["Vague or rounded numbers", "Consultants who can't explain their own model", "Being told she is wrong in front of her team"],
      trustBuilders: ["Owning an error quickly", "Walking through assumptions line by line", "Offering to reconcile with her FP&A team before the committee"],
      speakingStyle: "Clipped and precise. Asks short, pointed questions. Uses finance language: 'run rate', 'one-off', 'payback'.",
      privateFacts: [
        "Her FP&A lead found the inventory benefit counted twice last week",
        "The investment committee meets in nine days and she has told the chair to expect about £9m a year",
      ],
    },
  },
  {
    id: "james-whitfield",
    name: "James Whitfield",
    title: "Chief Executive",
    company: "Arden Health",
    personality: "Busy and disengaged. Gives you ten minutes and checks his phone.",
    avatarKey: "james-whitfield",
    brief: {
      motivations: ["Get to a decision fast", "Know what it means for his private-equity owners and his board"],
      triggers: ["Long context before the answer", "Methodology", "Technology jargon"],
      trustBuilders: ["Leading with the answer and the decision needed", "Quantified impact in £ and risk", "A clear ask with a date"],
      speakingStyle: "Terse. Interrupts. 'So what?' 'Bottom line?'",
      privateFacts: [
        "The legacy patient administration system had a six-hour outage last month and the CQC asked about it",
        "His owners want EBITDA growth before a refinancing next year",
      ],
    },
  },
  {
    id: "gareth-lloyd",
    name: "Gareth Lloyd",
    title: "Head of MI and Reporting",
    company: "Calder Water",
    personality: "Overstretched and protective of his data. Not hostile, but has been burned by consultants before.",
    avatarKey: "gareth-lloyd",
    brief: {
      motivations: ["Avoid extra work for his small team", "Stay on the right side of the Data Protection Officer"],
      triggers: ["Demands with no explanation of why", "Requests that sound like a GDPR breach", "Unrealistic deadlines"],
      trustBuilders: [
        "Explaining exactly what the analysis needs and why",
        "Proposing a compliant route (pseudonymised data, DPIA, minimum fields)",
        "Offering to do some of the work yourselves",
      ],
      speakingStyle: "Polite, cautious, a bit weary. 'I'll have to check with the DPO.'",
      privateFacts: ["A pseudonymised complaints table already exists for the regulator's annual return", "His team is two people down"],
    },
  },
  {
    id: "helen-marsh",
    name: "Helen Marsh",
    title: "Chief Information Officer",
    company: "Fenwick & Hale",
    personality: "New in post, sharp and time-poor. Polite but tired of consultancies pitching before they understand anything.",
    avatarKey: "helen-marsh",
    brief: {
      motivations: [
        "Make a visible impact in her first year without betting on the wrong programme",
        "Get the data-centre exit done before the lease ends next September",
        "Show the board how technology can help reverse falling online sales",
      ],
      triggers: [
        "Being pitched to before being asked anything",
        "Generic 'digital transformation' language and case studies from other sectors",
        "Name-dropping or talking about the firm's size",
      ],
      trustBuilders: [
        "Good questions about her situation, then a summary that shows real listening",
        "One specific, relevant insight about retail or data-centre exits",
        "A small, useful follow-up rather than a proposal",
      ],
      speakingStyle: "Brisk and direct, with a dry sense of humour. Answers short questions briefly and opens up to good ones.",
      privateFacts: [
        "The data-centre lease ends next September and the migration plan she inherited is six months behind",
        "The CFO is sceptical of IT spending after a failed e-commerce replatforming two years ago",
        "She has budget for a small diagnostic this quarter but hasn't told anyone",
      ],
    },
  },
  {
    id: "neil-forsyth",
    name: "Neil Forsyth",
    title: "Head of Procurement",
    company: "Pennine Mutual",
    personality: "Professional, tough and measured on savings. Uses the deadline and competitor prices as leverage.",
    avatarKey: "neil-forsyth",
    brief: {
      motivations: [
        "Show savings against the bid prices — he's targeted on it",
        "Avoid a project that overruns and comes back for more money",
        "Keep the COO happy, who prefers your bid",
      ],
      triggers: [
        "Instant discounts, which make him think the price was padded",
        "Refusing to discuss price at all",
        "Going over his head to the COO without telling him",
      ],
      trustBuilders: [
        "Explaining what's included, and the risk in the competitors' time-and-materials bids",
        "Trades that give him a saving he can report, such as payment terms, phasing or a reference",
        "A clear, written next step",
      ],
      speakingStyle: "Calm and firm, numbers-first. Phrases like 'best and final', 'value for money' and 'like-for-like'.",
      privateFacts: [
        "He can accept a 5–8% saving if it's framed as a reduction against list price",
        "Both competitors' time-and-materials bids exclude data migration, which the COO knows",
        "The COO has told him privately that your bid is the preferred option",
      ],
    },
  },
  {
    id: "owen-price",
    name: "Owen Price",
    title: "Chief Operating Officer",
    company: "Harbour Homes",
    personality: "Pragmatic and fair. Values the review but is wary of consultancies that turn one project into three.",
    avatarKey: "owen-price",
    brief: {
      motivations: [
        "Cut repeat repair visits and tenant complaints before the regulator's next inspection",
        "Keep within a budget the board has just cut by 8%",
        "Build capability in his own team rather than depend on consultants",
      ],
      triggers: [
        "'Phase 2' proposals that are more of the same with a bigger team",
        "Vague benefits without a baseline",
        "Pressure tactics or talk of 'momentum'",
      ],
      trustBuilders: [
        "Leading with the repeat-visit problem and its cost (about £2.4m a year)",
        "A small, time-boxed step with a clear exit and knowledge transfer to his team",
        "Honesty about what his team could do without you",
      ],
      speakingStyle: "Plain-spoken and dry. Asks 'what would I get for that?' and 'when do you leave?'.",
      privateFacts: [
        "He has about £250k of discretionary budget this year",
        "The board chair asked him about repeat repairs after a tenant complaint reached the local press",
        "He'd back a pilot in one region if it had a clear success measure",
      ],
    },
  },
];

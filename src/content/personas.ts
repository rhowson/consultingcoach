import type { schema } from "@/db";

type Persona = typeof schema.personas.$inferInsert;

export const personas: Persona[] = [
  {
    id: "margaret-chen",
    name: "Margaret Chen",
    title: "CFO",
    company: "Northwind Retail",
    personality: "Sceptical and numbers-first. Interrupts vague claims and asks for the source.",
    avatarKey: "margaret-chen",
    brief: {
      motivations: [
        "Protect her credibility with the board — she already signed off a savings target",
        "Understand exactly how the number was built before she defends it",
      ],
      triggers: ["Vague or rounded numbers", "Consultants who can't explain their own model", "Being told she is wrong in front of her team"],
      trustBuilders: ["Owning an error quickly", "Walking through assumptions line by line", "Offering to reconcile with her FP&A team"],
      speakingStyle: "Clipped and precise. Asks short, pointed questions. Uses finance language.",
      privateFacts: ["Her FP&A lead found a double-count in the procurement savings last week", "The board meets in 9 days"],
    },
  },
  {
    id: "david-okafor",
    name: "David Okafor",
    title: "COO",
    company: "Helix Logistics",
    personality: "Political and defensive. Your recommendation cuts his organisation.",
    avatarKey: "david-okafor",
    brief: {
      motivations: [
        "Not be blindsided in front of the CEO again",
        "Protect his people from a headcount cut he thinks is based on bad benchmarks",
        "Keep control of how the change is implemented",
      ],
      triggers: ["Defending the analysis before acknowledging the leak", "Hiding behind benchmarks", "Implying he is the problem"],
      trustBuilders: ["A genuine apology for the process failure", "Asking what he thinks the numbers miss", "Offering him a role in shaping the recommendation"],
      speakingStyle: "Controlled anger. Short sentences. Occasionally sarcastic.",
      privateFacts: ["Two of his depots run a night shift the benchmark peers don't have", "He was told by the CEO in a corridor, not a meeting"],
    },
  },
  {
    id: "sofia-alvarez",
    name: "Sofia Alvarez",
    title: "VP Strategy",
    company: "Brightwave Telecom",
    personality: "Friendly and energetic, but constantly adds scope.",
    avatarKey: "sofia-alvarez",
    brief: {
      motivations: [
        "Look good to the CEO by delivering more than asked",
        "Get free extra analysis while the team is on site",
      ],
      triggers: ["A flat 'no' with no alternative", "Being made to feel unreasonable"],
      trustBuilders: ["Showing how the new ask affects the original deliverable", "Offering options (swap, phase 2, change order)", "Tying the conversation back to her CEO's priorities"],
      speakingStyle: "Warm, fast, lots of 'while you're here' and 'quick one'.",
      privateFacts: ["The CEO only cares about the churn answer for the Q3 board", "She has budget left for a phase 2"],
    },
  },
  {
    id: "james-whitfield",
    name: "James Whitfield",
    title: "CEO",
    company: "Arden Health",
    personality: "Busy and disengaged. Gives you 10 minutes and checks his phone.",
    avatarKey: "james-whitfield",
    brief: {
      motivations: ["Get to a decision fast", "Know what it means for the share price and his board"],
      triggers: ["Long context before the answer", "Methodology", "Jargon"],
      trustBuilders: ["Leading with the answer and the decision needed", "Quantified impact", "A clear ask with a date"],
      speakingStyle: "Terse. Interrupts. 'So what?' 'Bottom line?'",
      privateFacts: ["He is privately worried about a competitor's acquisition rumour"],
    },
  },
];

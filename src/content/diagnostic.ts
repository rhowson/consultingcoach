/** Onboarding step 5: pick the best action title for each exhibit. */
export const titleQuiz = [
  {
    id: "q1",
    exhibit: "Data platform use cases: 3 live, 4 in build, 8 blocked by data quality, 5 blocked because no business owner. Spend to date: £14m.",
    options: [
      "Data platform use case status",
      "Overview of the data programme",
      "Thirteen of 20 use cases are blocked by data quality or ownership, not by the platform",
      "The data platform needs more investment",
    ],
    answerIndex: 2,
  },
  {
    id: "q2",
    exhibit: "Five-year cost of IT services: renew £56.0m, re-tender £47.9m, insource £49.8m (insourcing needs 46 new hires and £6.8m up front).",
    options: [
      "Re-tendering is £8.1m cheaper than renewing and avoids the hiring risk of insourcing",
      "Sourcing options cost comparison (£m)",
      "Costs vary across the three options",
      "We analysed the cost of each sourcing option",
    ],
    answerIndex: 0,
  },
] as const;

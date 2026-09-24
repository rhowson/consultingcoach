/** Onboarding step 5: pick the best action title for each exhibit. */
export const titleQuiz = [
  {
    id: "q1",
    exhibit: "SMB churn by months since contract end: in contract 1.1%; 0–3 months out 6.8%; 3–12 months 4.9%; 12+ months 2.7%.",
    options: [
      "SMB churn by contract status",
      "Churn analysis overview",
      "SMB customers are 6x more likely to leave in the 3 months after their contract ends",
      "Churn is a problem we need to look at",
    ],
    answerIndex: 2,
  },
  {
    id: "q2",
    exhibit: "Call-centre wait time was flat at 4.1–4.4 minutes across six quarters while churn rose.",
    options: [
      "Service levels held steady, so service is not driving the churn increase",
      "Call-centre wait times, Q1–Q6",
      "Wait times are important to customers",
      "We analysed call-centre data",
    ],
    answerIndex: 0,
  },
] as const;

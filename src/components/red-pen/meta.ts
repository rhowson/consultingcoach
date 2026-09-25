export const DELIVERABLE_TYPES = [
  { value: "steerco_deck", label: "SteerCo deck" },
  { value: "client_email", label: "Client email" },
  { value: "memo", label: "Memo" },
  { value: "exec_summary", label: "Exec summary" },
] as const;
export type DeliverableType = (typeof DELIVERABLE_TYPES)[number]["value"];

export const DELIVERABLE_LABEL = Object.fromEntries(DELIVERABLE_TYPES.map((d) => [d.value, d.label])) as Record<DeliverableType, string>;

export type Severity = "must_fix" | "should_fix" | "polish";
export const SEVERITIES: { value: Severity; label: string; cls: string; pin: string }[] = [
  { value: "must_fix", label: "Must fix", cls: "text-danger bg-danger-tint", pin: "bg-danger text-white" },
  { value: "should_fix", label: "Should fix", cls: "text-warning-ink bg-warning-tint", pin: "bg-warning text-white" },
  { value: "polish", label: "Polish", cls: "text-primary bg-primary-tint", pin: "bg-primary text-on-primary" },
];

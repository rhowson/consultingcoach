import type { GhostSlide, PyramidNode, StudioComment } from "@/lib/types";

export type Stage = "pyramid" | "ghost_deck" | "review";
export const STAGES: { key: Stage; label: string }[] = [
  { key: "pyramid", label: "Pyramid" },
  { key: "ghost_deck", label: "Ghost deck" },
  { key: "review", label: "Review" },
];

export const MAX_KEY_LINES = 5;
export const MAX_TITLE_WORDS = 15;

export const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function uid(prefix: string) {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export const emptyPyramid = (): PyramidNode => ({ id: "gt", text: "", children: [] });

/** Returns a label like "Key line 2 · support" for a comment target. */
export function targetLabel(pyramid: PyramidNode, slides: GhostSlide[], targetId: string): string | null {
  if (pyramid.id === targetId) return "Governing thought";
  for (const [i, kl] of pyramid.children.entries()) {
    if (kl.id === targetId) return `Key line ${i + 1}`;
    if (kl.children.some((s) => s.id === targetId)) return `Key line ${i + 1} · support`;
  }
  const si = slides.findIndex((s) => s.id === targetId);
  return si >= 0 ? `Slide ${si + 1}` : null;
}

export function inPyramid(pyramid: PyramidNode, id: string): boolean {
  return pyramid.id === id || pyramid.children.some((k) => k.id === id || k.children.some((s) => s.id === id));
}

/** Unresolved comments for a stage, numbered in order, plus a target → pin map. */
export function stageComments(stage: Stage, comments: StudioComment[], pyramid: PyramidNode, slides: GhostSlide[]) {
  const list = comments.filter((c) => {
    if (c.resolved) return false;
    const isNode = inPyramid(pyramid, c.targetId);
    const isSlide = slides.some((s) => s.id === c.targetId);
    if (!isNode && !isSlide) return true; // general comment: show everywhere
    if (stage === "pyramid") return isNode;
    if (stage === "ghost_deck") return isSlide;
    return true;
  });
  const pins: Record<string, number> = {};
  list.forEach((c, i) => {
    pins[c.targetId] ??= i + 1;
  });
  return { list, pins };
}

/** Replace a node's text anywhere in the (3-level) pyramid. */
export function setNodeText(p: PyramidNode, id: string, text: string): PyramidNode {
  if (p.id === id) return { ...p, text };
  return { ...p, children: p.children.map((c) => setNodeText(c, id, text)) };
}

export function focusField(id: string) {
  // Wait for React to commit the reorder before moving focus back.
  setTimeout(() => {
    const el = document.querySelector<HTMLElement>(`[data-field="${CSS.escape(id)}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, 0);
}

export const TAG_LABEL: Record<StudioComment["tag"], string> = {
  structure: "Structure",
  insight: "Insight",
  mece: "MECE",
  evidence: "Evidence",
  clarity: "Clarity",
};

export const SEVERITY: Record<StudioComment["severity"], { label: string; cls: string }> = {
  must_fix: { label: "Must fix", cls: "text-danger" },
  should_fix: { label: "Should fix", cls: "text-warning-ink" },
  polish: { label: "Polish", cls: "text-muted" },
};

export const STAGE_HINTS: Record<Stage, string[]> = {
  pyramid: [
    "Check each key line: is it a reason to believe the governing thought, or a finding about something else?",
    "Put the answer in the top box. If the CEO read only the governing thought, would she know what to do?",
  ],
  ghost_deck: [
    "Read each title aloud. If it could sit on any client's slide, it's a topic, not a claim.",
    "Every chart slide needs the one exhibit that proves its title. If you can't pick one, the title is a guess.",
  ],
  review: [
    "Titles should chain: each one answers “why?” or “so what?” about the one before.",
    "The last title should be the ask. End on what you need the committee to decide.",
  ],
};

export const TIPS = [
  "A strong pyramid answers the question in the top box.",
  "Action titles state the so-what, not the topic.",
  "Each key line should be a reason, not a category.",
];

export const CHART_TYPES = ["Bar", "Stacked bar", "Line", "Waterfall", "Scatter", "Table heatmap"] as const;

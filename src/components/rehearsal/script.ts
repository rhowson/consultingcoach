/**
 * SteerCo Rehearsal is scripted client-side: there is no rehearsal back end yet.
 * The committee's questions are generated deterministically from each slide's
 * action title and type (the CFO probes numbers on data slides, the COO probes
 * implementation, HR probes people impact, the CEO asks for the so-what), so the
 * same deck always produces the same run. Replace `scriptQuestions` with an API
 * call when a live rehearsal engine exists.
 */
import type { Exhibit, GhostSlide, PyramidNode } from "@/lib/types";
import { exhibitBars, exhibitNumber, exhibitTable, type ExhibitBar } from "@/components/studio/exhibit-data";

export type MemberId = "ceo" | "cfo" | "coo" | "hr";

export const COMMITTEE: { id: MemberId; name: string; role: string; initials: string; color: string }[] = [
  { id: "ceo", name: "Elena Marsh", role: "CEO", initials: "EM", color: "#2F4858" },
  { id: "cfo", name: "Raj Patel", role: "CFO", initials: "RP", color: "#7C3A2D" },
  { id: "coo", name: "Owen Hart", role: "COO", initials: "OH", color: "#3F5B3A" },
  { id: "hr", name: "Nadia Russo", role: "Head of HR", initials: "NR", color: "#6B4E8A" },
];

export interface RehearsalSlide {
  id: string;
  title: string;
  kind: "summary" | GhostSlide["slideType"];
  points: string[];
  bars: ExhibitBar[];
  table: string[][];
  foot: string;
}

export interface ScriptedQuestion {
  by: MemberId;
  text: string;
  follow: string;
}

const words = (t: string) => new Set(t.toLowerCase().match(/[a-z]{4,}/g) ?? []);

/** Supporting points of the key line that best matches a slide title. */
function matchSupports(pyramid: PyramidNode, title: string): string[] {
  const tw = words(title);
  let best: PyramidNode | null = null;
  let score = 0;
  for (const kl of pyramid.children) {
    const s = [...words(kl.text)].filter((w) => tw.has(w)).length;
    if (s > score) {
      score = s;
      best = kl;
    }
  }
  return (best?.children ?? []).map((c) => c.text).filter(Boolean);
}

export function buildDeck(pyramid: PyramidNode | null, slides: GhostSlide[], exhibits: Exhibit[]): RehearsalSlide[] {
  const deck: RehearsalSlide[] = [];
  if (pyramid?.text.trim()) {
    deck.push({
      id: "exec-summary",
      title: pyramid.text,
      kind: "summary",
      points: pyramid.children.map((k) => k.text).filter(Boolean),
      bars: [],
      table: [],
      foot: "Executive summary",
    });
  }
  for (const s of slides) {
    const ex = exhibits.find((e) => e.id === s.exhibitId);
    const n = exhibitNumber(exhibits, s.exhibitId);
    const dataSlide = s.slideType === "chart" || s.slideType === "table";
    deck.push({
      id: s.id,
      title: s.actionTitle || "Untitled slide",
      kind: s.slideType,
      points: dataSlide ? [] : pyramid ? matchSupports(pyramid, s.actionTitle).slice(0, s.slideType === "framework" ? 3 : 4) : [],
      bars: s.slideType === "chart" ? exhibitBars(ex) : [],
      table: s.slideType === "table" ? exhibitTable(ex).slice(0, 6) : [],
      foot: ex ? `Source: Exhibit ${n} · ${ex.title}` : s.slideType === "framework" ? "Framework" : s.slideType === "text" ? "Key message" : "",
    });
  }
  return deck;
}

const RECOMMEND = /\b(recommend|launch|offer|roll ?out|implement|invest|pilot|should|plan|programme|program|next step|reinstate|introduce)\w*/i;
const PEOPLE = /\b(team|staff|agent|people|hire|hiring|training|headcount|sales ?force|capacity|renewal calls|morale)\w*/i;
const NUMBER = /[$£€]?\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?\s*(?:%|pts?|points|m|k|bn)?/i;

const BANK: Record<MemberId, ScriptedQuestion[]> = {
  ceo: [
    { by: "ceo", text: "So what? If I remember one thing from this slide in front of the board, what should it be?", follow: "Good. Lead with that next time." },
    { by: "ceo", text: "If we do this and a competitor matches it within a quarter, what have we actually bought?", follow: "That's the answer I need for the board. Good." },
  ],
  cfo: [
    { by: "cfo", text: "What's the one number on this slide I should remember, and how confident are you in it?", follow: "Fine. Put the source in the footnote. Carry on." },
    { by: "cfo", text: "What does this cost us, and when does it pay back?", follow: "I'll want to see the payback maths afterwards." },
  ],
  coo: [
    { by: "coo", text: "Who owns this on Monday, and what breaks in operations if we roll it out next quarter?", follow: "Fair. Send me the rollout plan afterwards." },
    { by: "coo", text: "My teams will ask how this changes their week. What do I tell them?", follow: "Okay. Let's pick that up offline." },
  ],
  hr: [
    { by: "hr", text: "Who has to do something differently for this to work, and do they have the capacity?", follow: "Okay. Flag the people cost in the appendix." },
    { by: "hr", text: "Is this sustainable, or are we propping the numbers up with effort we can't keep?", follow: "Noted. Let's keep an eye on it." },
  ],
};

function questionFor(slide: RehearsalSlide, isLast: boolean): ScriptedQuestion {
  const t = slide.title;
  if (isLast && RECOMMEND.test(t)) return BANK.ceo[1];
  if (PEOPLE.test(t)) return BANK.hr[0];
  if (RECOMMEND.test(t)) return BANK.coo[0];
  if (slide.kind === "chart" || slide.kind === "table") {
    const num = t.match(NUMBER)?.[0]?.trim();
    if (num && /\d/.test(num)) {
      return {
        by: "cfo",
        text: num.includes("%")
          ? `You say ${num}. Of accounts or of revenue? Those give very different answers.`
          : `Where does ${num} come from, and is it a run-rate or a one-off?`,
        follow: "Right. Put that in the footnote. Carry on.",
      };
    }
    return BANK.cfo[0];
  }
  if (slide.kind === "framework") return BANK.coo[1];
  return isLast ? BANK.ceo[1] : BANK.ceo[0];
}

/** One question per slide after the opening one, never the same member twice in a row. */
export function scriptQuestions(deck: RehearsalSlide[]): (ScriptedQuestion | null)[] {
  const order: MemberId[] = ["ceo", "cfo", "coo", "hr"];
  let prev: MemberId | null = null;
  return deck.map((slide, i) => {
    if (i === 0 && deck.length > 1) return null;
    let q = questionFor(slide, i === deck.length - 1);
    if (q.by === prev) {
      const next = order[(order.indexOf(q.by) + 1 + (i % 3)) % order.length];
      q = BANK[next][i % 2];
    }
    prev = q.by;
    return q;
  });
}

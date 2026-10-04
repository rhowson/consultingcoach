import { ClipboardCheck, MessagesSquare, Route, type LucideIcon } from "lucide-react";
import { CARD, CONTAINER, LIFT, SectionHeading } from "./primitives";

const STEPS: { title: string; body: string; Icon: LucideIcon }[] = [
  {
    title: "Take the 10-minute diagnostic",
    body: "Tell us your level and the one you're aiming for. A short simulated conversation calibrates where you start.",
    Icon: ClipboardCheck,
  },
  {
    title: "Practise the moments that matter",
    body: "Client calls, storylines, SteerCos and drafts, set in realistic UK technology and transformation engagements.",
    Icon: MessagesSquare,
  },
  {
    title: "Get scored, specific feedback",
    body: "Every rep is marked against your target level's rubric, and your weekly plan targets the gaps it finds.",
    Icon: Route,
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" id="how-it-works" className="scroll-mt-24 pb-20 sm:pb-28">
      <div className={CONTAINER}>
        <SectionHeading id="how-title" eyebrow="How it works" first="From first rep" second="to promotion-ready" />
        <div className="relative mt-14">
          <span aria-hidden className="absolute top-[46px] right-[16%] left-[16%] hidden border-t-2 border-dashed border-border-strong md:block" />
          <ol className="relative m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`${CARD} ${LIFT} relative flex flex-col gap-3 p-6`}>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-on-primary shadow-md">
                    <s.Icon size={20} />
                  </span>
                  <span className="eyebrow">Step {i + 1}</span>
                </div>
                <h3 className="m-0 font-display text-xl font-semibold tracking-tight text-ink">{s.title}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

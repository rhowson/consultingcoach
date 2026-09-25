import { Check } from "lucide-react";

export interface ObjectiveState {
  id: string;
  label: string;
  met: boolean;
  /** Turn it was met at, when known (met in this browser session). */
  metAt?: number;
}

export function ObjectiveChecklist({ objectives }: { objectives: ObjectiveState[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {objectives.map((o) => (
        <li key={o.id} className="flex items-start gap-2.5">
          <span
            aria-hidden
            className={`mt-px flex h-5 w-5 flex-none items-center justify-center rounded-full text-white transition-colors duration-200 ${
              o.met ? "border border-success bg-success" : "border-[1.5px] border-border-strong bg-surface"
            }`}
          >
            {o.met && <Check size={12} strokeWidth={2.5} />}
          </span>
          <span className="flex flex-col leading-snug">
            <span className={`text-sm ${o.met ? "text-ink" : "text-ink-2"}`}>{o.label}</span>
            <span className="text-xs text-muted">
              <span className="sr-only">{o.met ? "Met. " : "Not met. "}</span>
              {o.met ? (o.metAt != null ? `Met at turn ${o.metAt}` : "Met") : "Not yet"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

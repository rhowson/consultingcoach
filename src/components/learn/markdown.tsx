import { Fragment, type ReactNode } from "react";

/**
 * Tiny, safe markdown renderer for lesson copy. Supports paragraphs (blank
 * lines), line breaks, **bold**, *italic* and "quotes" (rendered with curly
 * quotes). Everything is emitted as React text nodes — never raw HTML.
 */
export function Markdown({ source, className = "" }: { source: string; className?: string }) {
  const paragraphs = source
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i} className="m-0">
          {p.split("\n").map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {inline(line)}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

const TOKEN = /(\*\*(?:[^*]|\*(?!\*))+?\*\*|(?<!\*)\*(?!\*)[^*\s][^*]*\*|"[^"\n]+")/g;

export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(TOKEN)) {
    const t = m[0];
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (t.startsWith("**")) out.push(<strong key={k++} className="font-semibold">{inline(t.slice(2, -2))}</strong>);
    else if (t.startsWith("*")) out.push(<em key={k++}>{inline(t.slice(1, -1))}</em>);
    else out.push(<Fragment key={k++}>{"“"}{inline(t.slice(1, -1))}{"”"}</Fragment>);
    last = at + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

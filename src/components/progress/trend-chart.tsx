"use client";

import { useEffect, useRef, useState } from "react";
import { COMPETENCIES, COMPETENCY_LABELS, LEVEL_BAR, type Competency } from "@/lib/competency";
import { SERIES } from "./series";

export interface TrendPoint {
  competency: Competency;
  score: number;
  at: string;
}

const WEEKS = 12;
const DAY = 86_400_000;
const H = 280;
const M = { top: 16, right: 118, bottom: 30, left: 32 };

/** 12-week competency trend: inline SVG, direct end labels, and a visually-hidden data table. */
export function TrendChart({ points, now }: { points: TrendPoint[]; now: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(300, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const end = new Date(now).getTime();
  const start = end - WEEKS * 7 * DAY;
  const pw = width - M.left - M.right;
  const ph = H - M.top - M.bottom;
  const x = (t: number) => M.left + ((t - start) / (end - start)) * pw;
  const y = (s: number) => M.top + ((5 - s) / 4) * ph;

  const series = COMPETENCIES.map((c) => {
    const pts = points
      .filter((p) => p.competency === c)
      .map((p) => ({ t: Math.max(start, new Date(p.at).getTime()), s: p.score }))
      .sort((a, b) => a.t - b.t);
    return { c, pts };
  }).filter((s) => s.pts.length > 0);

  // End labels: sit at the last value, nudged apart so they don't collide.
  const labels = series
    .map((s) => ({ c: s.c, y: y(s.pts[s.pts.length - 1].s), score: s.pts[s.pts.length - 1].s }))
    .sort((a, b) => a.y - b.y);
  const GAP = 15;
  for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < GAP) labels[i].y = labels[i - 1].y + GAP;
  const overflow = labels.length ? labels[labels.length - 1].y - (M.top + ph) : 0;
  if (overflow > 0) labels.forEach((l) => (l.y -= overflow));

  const weekTicks = Array.from({ length: WEEKS / 2 + 1 }, (_, i) => start + i * 14 * DAY);
  const fmt = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const summary = series
    .map((s) => {
      const first = s.pts[0].s;
      const last = s.pts[s.pts.length - 1].s;
      return `${COMPETENCY_LABELS[s.c]} ${first.toFixed(1)} to ${last.toFixed(1)}`;
    })
    .join("; ");

  return (
    <div ref={ref} className="w-full">
      <svg
        width={width}
        height={H}
        viewBox={`0 0 ${width} ${H}`}
        role="img"
        aria-label={`Competency scores over the last 12 weeks. ${summary}. Bar is ${LEVEL_BAR}.`}
        className="block max-w-full overflow-visible"
      >
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={M.left} x2={M.left + pw} y1={y(v)} y2={y(v)} stroke="var(--divider)" />
            <text x={M.left - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--muted)" className="tabular">
              {v}
            </text>
          </g>
        ))}
        {weekTicks.map((t, i) => (
          <text
            key={t}
            x={x(t)}
            y={H - 8}
            textAnchor={i === 0 ? "start" : i === weekTicks.length - 1 ? "end" : "middle"}
            fontSize="11"
            fill="var(--muted)"
            className={width < 480 && i % 2 ? "hidden" : ""}
          >
            {i === weekTicks.length - 1 ? "Now" : fmt(t)}
          </text>
        ))}
        {/* Bar */}
        <line x1={M.left} x2={M.left + pw} y1={y(LEVEL_BAR)} y2={y(LEVEL_BAR)} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={M.left + 4} y={y(LEVEL_BAR) - 5} fontSize="11" fontWeight="600" fill="var(--accent-ink)">
          Bar {LEVEL_BAR}
        </text>

        {series.map(({ c, pts }) => {
          const st = SERIES[c];
          const path = [...pts, { t: end, s: pts[pts.length - 1].s }]
            .map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.s).toFixed(1)}`)
            .join(" ");
          return (
            <g key={c}>
              <path d={path} fill="none" stroke={st.color} strokeWidth="2" strokeDasharray={st.dash} strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={x(p.t)} cy={y(p.s)} r="3" fill="var(--surface)" stroke={st.color} strokeWidth="1.5" />
              ))}
            </g>
          );
        })}

        {labels.map((l) => {
          const last = y(l.score);
          return (
            <g key={l.c}>
              {Math.abs(l.y - last) > 2 && (
                <line x1={M.left + pw + 2} x2={M.left + pw + 8} y1={last} y2={l.y} stroke={SERIES[l.c].color} />
              )}
              <text x={M.left + pw + 10} y={l.y} dy="0.32em" fontSize="12" fontWeight="600" fill={SERIES[l.c].color}>
                {SERIES[l.c].short} <tspan className="tabular" fill="var(--ink-2)">{l.score.toFixed(1)}</tspan>
              </text>
            </g>
          );
        })}
      </svg>

      <table className="sr-only">
        <caption>Competency score changes, last 12 weeks</caption>
        <thead>
          <tr>
            <th scope="col">Competency</th>
            <th scope="col">Date</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          {series.flatMap(({ c, pts }) =>
            pts.map((p, i) => (
              <tr key={`${c}-${i}`}>
                <th scope="row">{COMPETENCY_LABELS[c]}</th>
                <td>{fmt(p.t)}</td>
                <td>{p.s.toFixed(1)}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

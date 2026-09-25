import type { Exhibit } from "@/lib/types";

export interface ExhibitBar {
  label: string;
  /** Display value as written in the exhibit ("4.3%", "$149"). */
  display: string;
  value: number;
  /** 0–100, relative to the largest bar. */
  pct: number;
  highlight: boolean;
}

const NUM = /[-+]?[$£€]?\d+(?:[.,]\d+)?\s*[%mkMbB]?/g;

function lastNumber(cell: string): { display: string; value: number } | null {
  const matches = cell.replace(/\([^)]*\)/g, "").match(NUM);
  if (!matches) return null;
  const display = matches[matches.length - 1].trim();
  const value = parseFloat(display.replace(/[^\d.+-]/g, ""));
  return Number.isFinite(value) ? { display, value } : null;
}

/**
 * Exhibits are stored as plain text ("a | b | c" rows). Pick the most telling
 * numeric row and turn it into bars for thumbnails and rehearsal slides.
 */
export function exhibitBars(ex: Exhibit | undefined, max = 8): ExhibitBar[] {
  if (!ex) return [];
  const rows = ex.data
    .split("\n")
    .map((r) => r.split("|").map((c) => c.trim()))
    .filter((r) => r.some(Boolean));
  const header = rows[0] && rows[0].slice(1).every((c) => !lastNumber(c) || /^[A-Z]\d+$/.test(c)) ? rows[0] : null;

  let best: { label: string; display: string; value: number }[] = [];
  let bestSpread = -1;
  for (const row of rows) {
    if (row === header) continue;
    // Tables with a row label ("SMB | 2.1% | …") vs. inline "label value" cells ("Q1 4.1 | Q2 4.3").
    const labelled = row.length > 1 && !lastNumber(row[0]);
    const cells = labelled ? row.slice(1) : row;
    const points = cells
      .map((c, i) => {
        const n = lastNumber(c);
        if (!n) return null;
        const label = header && labelled ? header[i + 1] ?? "" : c.replace(n.display, "").replace(/[:\s]+$/, "").trim();
        return { label, ...n };
      })
      .filter((p): p is { label: string; display: string; value: number } => p !== null);
    if (points.length < 2) continue;
    const vals = points.map((p) => p.value);
    const hi = Math.max(...vals);
    const spread = hi > 0 ? (hi - Math.min(...vals)) / hi : 0;
    if (spread > bestSpread) {
      bestSpread = spread;
      best = points;
    }
  }
  // Two-column tables ("Brightwave | $189"): one bar per row.
  if (best.length < 2) {
    best = rows
      .filter((r) => r !== header && r.length > 1 && !lastNumber(r[0]))
      .map((r) => {
        const n = lastNumber(r[r.length - 1]);
        return n ? { label: r[0], ...n } : null;
      })
      .filter((p): p is { label: string; display: string; value: number } => p !== null);
  }
  const points = best.slice(0, max);
  const vals = points.map((p) => p.value);
  const top = Math.max(...vals, 0);
  const low = Math.min(...vals);
  // Highlight the standout values, but only when the data actually varies.
  const varied = top > 0 && (top - low) / top > 0.1;
  return points.map((p) => ({
    ...p,
    pct: top > 0 ? Math.max(4, (p.value / top) * 100) : 4,
    highlight: varied && (p.value - low) / (top - low) >= 0.75,
  }));
}

/** Exhibit data as a simple grid (for table slides in rehearsal). */
export function exhibitTable(ex: Exhibit | undefined): string[][] {
  if (!ex) return [];
  return ex.data
    .split("\n")
    .map((r) => r.split("|").map((c) => c.trim()))
    .filter((r) => r.some(Boolean));
}

export function exhibitNumber(exhibits: Exhibit[], id: string | undefined) {
  const i = exhibits.findIndex((e) => e.id === id);
  return i < 0 ? null : i + 1;
}

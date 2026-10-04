/** Persona colours from the design system. Unknown personas fall back to slate. */
const PERSONA_BG: Record<string, string> = {
  "margaret-chen": "#7C3A2D",
  "david-okafor": "#3F5B3A",
  "sofia-alvarez": "#6B4E8A",
  "james-whitfield": "#2F4858",
  "graham-holt": "#5B4636",
  "amara-osei": "#7A3E65",
  "mark-bennett": "#335C67",
  "gareth-lloyd": "#4A5D23",
  "rachel-doyle": "#8A5A2B",
  "helen-marsh": "#2E5E4E",
  "neil-forsyth": "#5A4A7A",
  "owen-price": "#6B5B3A",
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Rounded-square display-initial avatar for AI personas. */
export function PersonaAvatar({
  id,
  name,
  size = 40,
  ring,
}: {
  id: string;
  name: string;
  size?: number;
  /** Mood ring colour (e.g. while the persona is frustrated). */
  ring?: string;
}) {
  return (
    <div
      aria-hidden
      className="flex flex-none items-center justify-center rounded-[30%] font-display font-semibold tracking-tight text-white shadow-sm"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: PERSONA_BG[id] ?? "var(--level-analyst)",
        boxShadow: ring ? `0 0 0 2px var(--surface), 0 0 0 4px ${ring}` : undefined,
      }}
    >
      {initials(name)}
    </div>
  );
}

/** Round avatar for people (the signed-in user). */
export function UserAvatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      aria-hidden
      className="flex flex-none items-center justify-center rounded-full bg-primary-tint font-semibold text-primary ring-2 ring-surface"
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.38)) }}
    >
      {initials(name)}
    </div>
  );
}

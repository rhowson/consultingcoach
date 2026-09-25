/** Persona colours from the design system. Unknown personas fall back to slate. */
const PERSONA_BG: Record<string, string> = {
  "margaret-chen": "#7C3A2D",
  "david-okafor": "#3F5B3A",
  "sofia-alvarez": "#6B4E8A",
  "james-whitfield": "#2F4858",
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Square serif-initial avatar for AI personas. */
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
      className="flex flex-none items-center justify-center rounded-lg font-serif font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: PERSONA_BG[id] ?? "#475569",
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
      className="flex flex-none items-center justify-center rounded-full bg-border text-xs font-semibold text-ink"
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </div>
  );
}

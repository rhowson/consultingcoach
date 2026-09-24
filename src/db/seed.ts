/**
 * Idempotent seed: upserts all content and a demo user.
 * Run with `npm run db:seed` after `npm run db:migrate`.
 */
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "./schema";
import { personas } from "../content/personas";
import { rubrics, scenarios } from "../content/scenarios";
import { lessons, tracks } from "../content/lessons";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

/** Build an ON CONFLICT DO UPDATE set clause that overwrites every column but the key. */
function excludedAll(table: Record<string, unknown>, cols: string[]) {
  return Object.fromEntries(cols.map((c) => [c, sql.raw(`excluded."${(table[c] as { name: string }).name}"`)]));
}

async function upsert<T extends Record<string, unknown>>(table: Parameters<typeof db.insert>[0], rows: T[], key: string[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]).filter((c) => !key.includes(c));
  const t = table as unknown as Record<string, unknown>;
  await db
    .insert(table)
    .values(rows as never)
    .onConflictDoUpdate({ target: key.map((k) => t[k]) as never, set: excludedAll(t, cols) as never });
}

// Content (order matters for foreign keys)
await upsert(schema.personas, personas, ["id"]);
await upsert(schema.rubrics, rubrics, ["id"]);
for (const s of scenarios) await upsert(schema.scenarios, [{ openingLine: null, personaId: null, casePack: null, isPro: false, ...s }], ["id"]);
await upsert(schema.tracks, tracks, ["id"]);
for (const l of lessons) await upsert(schema.lessons, [{ practiceScenarioId: null, ...l }], ["id"]);

// Demo user — matches the story used across the design spec.
const demoEmail = "priya@demo.consultingcoach.app";
const [demo] = await db
  .insert(schema.users)
  .values({
    email: demoEmail,
    passwordHash: await bcrypt.hash("coachdemo", 12),
    name: "Priya Shah",
    currentLevel: "consultant",
    targetLevel: "manager",
    targetDate: "2027-03-31",
    goal: "promotion",
    onboardedAt: new Date(),
  })
  .onConflictDoUpdate({ target: schema.users.email, set: { name: "Priya Shah" } })
  .returning();

const demoScores = {
  problem_solving: 3.8,
  storyboarding: 3.4,
  client_management: 3.1,
  difficult_conversations: 2.4,
  output_quality: 3.6,
} as const;

for (const [competency, score] of Object.entries(demoScores)) {
  await db
    .insert(schema.competencyScores)
    .values({ userId: demo.id, competency: competency as keyof typeof demoScores, score })
    .onConflictDoUpdate({
      target: [schema.competencyScores.userId, schema.competencyScores.competency],
      set: { score, updatedAt: new Date() },
    });
}

console.log(`Seeded ${personas.length} personas, ${scenarios.length} scenarios, ${lessons.length} lessons.`);
console.log(`Demo login: ${demoEmail} / coachdemo`);
await pool.end();

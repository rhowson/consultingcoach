import { sql } from "drizzle-orm";
import { db } from "@/db";
import { aiMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Touch a real table so a database without migrations fails the health check.
    await db.execute(sql`select 1 from users limit 1`);
    return Response.json({ ok: true, db: "up", ai: aiMode });
  } catch {
    return Response.json({ ok: false, db: "down", ai: aiMode }, { status: 503 });
  }
}

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { aiMockMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, db: "up", ai: aiMockMode ? "mock" : "live" });
  } catch {
    return Response.json({ ok: false, db: "down", ai: aiMockMode ? "mock" : "live" }, { status: 503 });
  }
}

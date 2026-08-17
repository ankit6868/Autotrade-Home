import { NextResponse } from "next/server";
import { sql, currentAdmin } from "@/lib/db";

// Protected: list enquiries + summary counts for the admin panel.
export async function GET() {
  if (!(await currentAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT id, name, email, phone, portfolio, interests, message, status, created_at
    FROM enquiries ORDER BY created_at DESC LIMIT 1000`;

  const total = rows.length;
  const unread = rows.filter((r) => r.status === "new").length;
  const today = rows.filter(
    (r) => new Date(r.created_at as string).toDateString() === new Date().toDateString(),
  ).length;

  return NextResponse.json({ enquiries: rows, stats: { total, unread, today } });
}

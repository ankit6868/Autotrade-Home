import { NextResponse } from "next/server";
import { sql, currentAdmin } from "@/lib/db";

// Protected: mark an enquiry read/new (PATCH) or delete it (DELETE).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await currentAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const { status } = await req.json().catch(() => ({} as { status?: string }));
  const next = status === "new" ? "new" : "read";
  await sql`UPDATE enquiries SET status = ${next} WHERE id = ${id}`;
  return NextResponse.json({ ok: true, status: next });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await currentAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  await sql`DELETE FROM enquiries WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { sql, currentAdmin, getAdmin, verifyPassword, hashPassword } from "@/lib/db";

// Protected: change the admin password from the Account page.
// `current` is optional (you're already authenticated) but validated when sent.
export async function POST(req: Request) {
  if (!(await currentAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { current, password } = await req.json().catch(
    () => ({} as { current?: string; password?: string }),
  );
  const next = String(password ?? "");
  if (next.length < 6)
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });

  const admin = await getAdmin();
  if (admin && current !== undefined && current !== "" && !verifyPassword(String(current), admin.password_hash)) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  await sql`UPDATE admin SET password_hash = ${hashPassword(next)}, updated_at = now() WHERE id = 1`;
  return NextResponse.json({ ok: true });
}

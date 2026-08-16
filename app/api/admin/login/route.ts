import { NextResponse } from "next/server";
import {
  getAdmin, verifyPassword, signSession, ADMIN_COOKIE, ADMIN_SESSION_TTL,
} from "@/lib/db";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({} as Record<string, string>));
  let admin;
  try {
    admin = await getAdmin();
  } catch {
    return NextResponse.json(
      { error: "Database not reachable. Create Vercel Postgres in your project's Storage tab." },
      { status: 500 },
    );
  }
  if (!admin) return NextResponse.json({ error: "Admin not set up." }, { status: 500 });

  const okUser = String(username ?? "").trim().toLowerCase() === admin.username.toLowerCase();
  const okPass = verifyPassword(String(password ?? ""), admin.password_hash);
  if (!okUser || !okPass) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const token = signSession(admin.session_secret, admin.username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL,
  });
  return res;
}

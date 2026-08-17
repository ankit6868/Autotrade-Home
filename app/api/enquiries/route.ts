import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

// Public: a visitor submits the "Talk to us" form on the landing page.
export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({} as Record<string, unknown>));

    // Honeypot — real users never fill the hidden "company" field. Bots do.
    // Pretend success so the bot moves on, but store nothing.
    if (typeof b.company === "string" && b.company.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    const s = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
    const name = s(b.name, 120);
    const email = s(b.email, 200);
    const phone = s(b.phone, 40);
    const portfolio = s(b.portfolio, 60);
    const interests = Array.isArray(b.interests)
      ? (b.interests as unknown[]).map((x) => String(x)).join(", ").slice(0, 240)
      : s(b.interests, 240);
    const message = s(b.message, 2000);

    if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (!email && !phone)
      return NextResponse.json({ error: "Add an email or phone so we can reach you." }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });

    await initDb();
    await sql`INSERT INTO enquiries (name, email, phone, portfolio, interests, message)
              VALUES (${name}, ${email}, ${phone}, ${portfolio}, ${interests}, ${message})`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't send right now — please try again." }, { status: 500 });
  }
}

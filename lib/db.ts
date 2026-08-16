// ─────────────────────────────────────────────────────────────────────────
// Enquiries + admin persistence (Vercel Postgres) and admin auth helpers.
//
// Storage: Vercel Postgres — set up via your Vercel project → Storage →
// Create Database → Postgres. It injects POSTGRES_URL automatically; no code
// change needed. Tables are created lazily on first use (idempotent).
//
// Admin: a single admin row (username + scrypt password hash + a per-install
// session secret). Seeded on first run from ADMIN_USER / ADMIN_PASSWORD env
// (defaults: "Admin" / "Autotrade@7890"). The password is changeable from the
// Account page, which updates the hash in the DB. Node crypto only — no extra
// dependency, and it stays on the Node.js runtime (never Edge).
// ─────────────────────────────────────────────────────────────────────────
import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { sql } from "@vercel/postgres";

export const ADMIN_COOKIE = "atadmin";
export const ADMIN_SESSION_TTL = 60 * 60 * 24 * 7; // 7 days (seconds)

// ── schema init + seed (idempotent, cached per serverless instance) ────────
let _initPromise: Promise<void> | null = null;
export function initDb(): Promise<void> {
  if (!_initPromise) {
    _initPromise = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS enquiries (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        email      TEXT,
        phone      TEXT,
        portfolio  TEXT,
        interests  TEXT,
        message    TEXT,
        status     TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS admin (
        id             INT PRIMARY KEY,
        username       TEXT NOT NULL,
        password_hash  TEXT NOT NULL,
        session_secret TEXT NOT NULL,
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      const { rows } = await sql`SELECT id FROM admin WHERE id = 1`;
      if (rows.length === 0) {
        const username = process.env.ADMIN_USER || "Admin";
        const initialPw = process.env.ADMIN_PASSWORD || "Autotrade@7890";
        const hash = hashPassword(initialPw);
        const secret = crypto.randomBytes(32).toString("hex");
        await sql`INSERT INTO admin (id, username, password_hash, session_secret)
                  VALUES (1, ${username}, ${hash}, ${secret})
                  ON CONFLICT (id) DO NOTHING`;
      }
    })().catch((e) => {
      // Reset so a transient failure (e.g. DB not provisioned yet) can retry.
      _initPromise = null;
      throw e;
    });
  }
  return _initPromise;
}

// ── password hashing — scrypt, dependency-free ─────────────────────────────
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(pw, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(derived, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type AdminRow = { username: string; password_hash: string; session_secret: string };
export async function getAdmin(): Promise<AdminRow | undefined> {
  await initDb();
  const { rows } = await sql`SELECT username, password_hash, session_secret FROM admin WHERE id = 1`;
  return rows[0] as AdminRow | undefined;
}

// ── signed session token (HMAC-SHA256) ─────────────────────────────────────
export function signSession(secret: string, username: string): string {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL;
  const payload = `${username}|${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}
export function verifySession(secret: string, token: string): string | null {
  try {
    const raw = Buffer.from(token, "base64url").toString();
    const parts = raw.split("|");
    if (parts.length !== 3) return null;
    const [username, expStr, sig] = parts;
    const exp = parseInt(expStr, 10);
    if (!Number.isFinite(exp) || Date.now() / 1000 > exp) return null;
    const expected = crypto.createHmac("sha256", secret).update(`${username}|${exp}`).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return username;
  } catch {
    return null;
  }
}

// ── auth guard — returns the logged-in username or null (reads the cookie) ──
export async function currentAdmin(): Promise<string | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const admin = await getAdmin().catch(() => undefined);
  if (!admin) return null;
  return verifySession(admin.session_secret, token);
}

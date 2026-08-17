// ─────────────────────────────────────────────────────────────────────────
// Enquiries + admin persistence (Postgres via postgres.js) and admin auth.
//
// Storage: any Postgres — provider-agnostic. Connect a database in your Vercel
// project (Storage tab) and it injects POSTGRES_URL. Works with Supabase's
// transaction pooler (port 6543 → prepare:false), Neon, or plain Postgres.
// Tables are created lazily on first use (idempotent).
//
// Admin: a single admin row (username + scrypt password hash + a per-install
// session secret). Seeded on first run from ADMIN_USER / ADMIN_PASSWORD env
// (defaults: "Admin" / "Autotrade@7890"). The password is changeable from the
// Account page, which updates the hash in the DB. Node crypto only — no extra
// hashing dependency, and it stays on the Node.js runtime (never Edge).
// ─────────────────────────────────────────────────────────────────────────
import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import postgres from "postgres";

// Lazy client — resolve the connection string from ANY of the names a Vercel
// Postgres / Supabase / Neon integration may inject, so setup "just works".
// Created on first query only (never at build/import time). Query params are
// stripped (Supabase appends a non-standard `supa=` marker) and SSL is set
// explicitly; prepare:false is required for the pgBouncer/Supavisor pooler.
let _sql: ReturnType<typeof postgres> | null = null;
function client(): ReturnType<typeof postgres> {
  if (!_sql) {
    const raw =
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL_UNPOOLED;
    if (!raw) throw new Error("No Postgres connection string configured (POSTGRES_URL).");
    const cs = raw.split("?")[0]; // drop non-standard query params
    _sql = postgres(cs, {
      ssl: "require",
      prepare: false, // required for Supabase's transaction pooler
      max: 1, // one connection per serverless instance
      idle_timeout: 20,
      connect_timeout: 15,
    });
  }
  return _sql;
}

// Tagged-template passthrough so every caller keeps using sql`...` unchanged.
// postgres.js resolves to a RowList (a real Array), so callers read the array
// directly: `const rows = await sql`SELECT ...``.
export function sql<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client()(strings as any, ...(values as any[])) as unknown as Promise<T[]>;
}

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
      const rows = await sql`SELECT id FROM admin WHERE id = 1`;
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
  const rows = await sql<AdminRow>`SELECT username, password_hash, session_secret FROM admin WHERE id = 1`;
  return rows[0];
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

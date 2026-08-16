"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { site } from "@/lib/site";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("Admin");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d?.error || "Login failed.");
        setBusy(false);
        return;
      }
      router.replace("/admin");
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-brand-400/60";

  return (
    <main className="grid min-h-screen place-items-center bg-ink-950 px-5">
      <div className="w-full max-w-sm">
        <div className="gradient-border rounded-3xl border border-white/[0.08] bg-gradient-to-b from-ink-800 to-ink-950 p-7 shadow-card">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-iris-500 text-sm font-black text-ink-950">
            AT
          </div>
          <h1 className="mt-5 text-xl font-extrabold tracking-tight text-white">Admin Login</h1>
          <p className="mt-1 text-sm text-slate-400">{site.brand} — Enquiries Console</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Username
              </label>
              <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Password
              </label>
              <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" />
            </div>

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
              {busy ? (
                <>Signing in <Loader2 className="h-4 w-4 animate-spin" /></>
              ) : (
                <><Lock className="h-4 w-4" /> Sign In <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>
        <a href="/" className="mt-5 block text-center text-xs text-slate-500 hover:text-slate-300">
          ← Back to site
        </a>
      </div>
    </main>
  );
}

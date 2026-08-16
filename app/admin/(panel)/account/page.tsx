"use client";

import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

export default function AccountPage() {
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw.length < 6) return setMsg({ ok: false, text: "New password must be at least 6 characters." });
    if (pw !== confirm) return setMsg({ ok: false, text: "Passwords don't match." });
    setBusy(true);
    try {
      const r = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, password: pw }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMsg({ ok: false, text: d?.error || "Couldn't update password." });
      } else {
        setMsg({ ok: true, text: "Password updated. Use it next time you sign in." });
        setCurrent(""); setPw(""); setConfirm("");
      }
    } catch {
      setMsg({ ok: false, text: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-brand-400/60";
  const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400";

  return (
    <div className="px-6 py-8 sm:px-10">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-white">Account</h1>

      <div className="glass max-w-md rounded-2xl p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-brand-400">
            <KeyRound className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-white">Change password</h2>
            <p className="text-xs text-slate-400">Updates immediately — no re-login needed.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className={labelCls}>Current password <span className="text-slate-600">(optional)</span></label>
            <input className={inputCls} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          <div>
            <label className={labelCls}>New password (min 6 chars)</label>
            <input className={inputCls} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          </div>
          <div>
            <label className={labelCls}>Confirm password</label>
            <input className={inputCls} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          </div>

          {msg && (
            <p className={`rounded-lg border px-3 py-2 text-xs ${
              msg.ok ? "border-ok/30 bg-ok/10 text-ok" : "border-danger/30 bg-danger/10 text-danger"
            }`}>
              {msg.text}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? <>Updating <Loader2 className="h-4 w-4 animate-spin" /></> : <><ShieldCheck className="h-4 w-4" /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}

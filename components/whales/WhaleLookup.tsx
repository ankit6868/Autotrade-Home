"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

type Pos = {
  coin: string;
  szi: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
  leverage: { value: number };
};

type State = {
  marginSummary: { accountValue: string; totalNtlPos: string; totalRawUsd: string };
  assetPositions: { position: Pos }[];
};

const money = (n: number, d = 2) =>
  (n < 0 ? "-$" : "$") +
  Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

const compact = (n: number) => {
  const a = Math.abs(n);
  const s = n < 0 ? "-" : "";
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(1)}K`;
  return money(n);
};

export default function WhaleLookup() {
  const [addr, setAddr] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState<State | null>(null);
  const [scanned, setScanned] = useState("");

  async function reveal(e?: React.FormEvent) {
    e?.preventDefault();
    const a = addr.trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(a)) {
      setErr("Enter a valid 0x… Hyperliquid address (42 chars).");
      return;
    }
    setLoading(true);
    setErr("");
    setData(null);
    try {
      const r = await fetch("/api/hl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clearinghouseState", user: a }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error === "invalid_address" ? "Invalid address." : "Lookup failed.");
      setData(d);
      setScanned(a);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lookup failed — try again.");
    }
    setLoading(false);
  }

  const positions = (data?.assetPositions || [])
    .map((p) => p.position)
    .filter((p) => Number(p.szi) !== 0)
    .sort((a, b) => Math.abs(Number(b.positionValue)) - Math.abs(Number(a.positionValue)));

  const acct = data ? Number(data.marginSummary.accountValue) : 0;
  const totalPnl = positions.reduce((s, p) => s + Number(p.unrealizedPnl), 0);

  return (
    <div>
      <form onSubmit={reveal} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="Enter wallet for positions & PnL — 0x…"
            spellCheck={false}
            className="w-full rounded-xl border border-white/10 bg-ink-900/70 py-3.5 pl-11 pr-4 font-mono text-sm text-slate-100 outline-none transition-colors focus:border-brand-400/50"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary shrink-0 !px-6 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reveal"}
        </button>
      </form>

      {err && (
        <div className="mt-3 flex items-center gap-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4" /> {err}
        </div>
      )}

      {data && (
        <div className="mt-5">
          {/* summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Account value", compact(acct), "text-white"],
              ["Open positions", String(positions.length), "text-white"],
              ["Notional", compact(Number(data.marginSummary.totalNtlPos)), "text-white"],
              ["Unrealized PnL", compact(totalPnl), totalPnl >= 0 ? "text-ok" : "text-danger"],
            ].map(([k, v, tone]) => (
              <div key={k} className="glass p-3.5">
                <div className="text-[11px] text-slate-400">{k}</div>
                <div className={`tabular mt-0.5 text-lg font-bold ${tone}`}>{v}</div>
              </div>
            ))}
          </div>

          {positions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              No open positions for <span className="font-mono">{scanned.slice(0, 6)}…{scanned.slice(-4)}</span> right now.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    {["Asset", "Side", "Size", "Entry", "Value", "PnL", "ROE", "Liq.", "Lev"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tabular">
                  {positions.map((p) => {
                    const long = Number(p.szi) > 0;
                    const pnl = Number(p.unrealizedPnl);
                    const roe = Number(p.returnOnEquity) * 100;
                    return (
                      <tr key={p.coin} className="border-t border-white/[0.05]">
                        <td className="px-3 py-2.5 font-semibold text-white">{p.coin}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold ${long ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"}`}>
                            {long ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {long ? "Long" : "Short"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300">{Math.abs(Number(p.szi)).toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
                        <td className="px-3 py-2.5 text-slate-300">{money(Number(p.entryPx), 2)}</td>
                        <td className="px-3 py-2.5 text-slate-200">{compact(Number(p.positionValue))}</td>
                        <td className={`px-3 py-2.5 font-semibold ${pnl >= 0 ? "text-ok" : "text-danger"}`}>{compact(pnl)}</td>
                        <td className={`px-3 py-2.5 ${roe >= 0 ? "text-ok" : "text-danger"}`}>{roe >= 0 ? "+" : ""}{roe.toFixed(1)}%</td>
                        <td className="px-3 py-2.5 text-slate-400">{p.liquidationPx ? money(Number(p.liquidationPx), 2) : "—"}</td>
                        <td className="px-3 py-2.5 text-slate-400">{p.leverage?.value ?? "—"}×</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              Live from Hyperliquid · {scanned.slice(0, 6)}…{scanned.slice(-4)} · read-only, no sign-up.
            </p>
            <Link href={`/whales/${scanned}`} className="text-[12px] font-semibold text-brand-300 hover:text-brand-200">
              View full dashboard →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

/* ── helpers ─────────────────────────────────────────────────────────────── */
const money = (n: number, d = 2) =>
  (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const compact = (n: number) => {
  const a = Math.abs(n);
  const s = n < 0 ? "-$" : "$";
  if (a >= 1e9) return `${s}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${s}${(a / 1e3).toFixed(1)}K`;
  return money(n);
};
const num = (v: unknown) => Number(v) || 0;

async function hl<T>(body: object): Promise<T | null> {
  try {
    const r = await fetch("/api/hl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/* ── types ───────────────────────────────────────────────────────────────── */
type Pos = { coin: string; szi: string; entryPx: string; positionValue: string; unrealizedPnl: string; returnOnEquity: string; liquidationPx: string | null; leverage: { value: number }; marginUsed: string };
type Fill = { coin: string; dir: string; closedPnl: string; sz: string; px: string; time: number; fee: string };
type Portfolio = [string, { accountValueHistory: [number, string][]; pnlHistory: [number, string][] }][];

const WINDOWS: { k: "1D" | "1W" | "1M" | "All"; base: string; perp: string }[] = [
  { k: "1D", base: "day", perp: "perpDay" },
  { k: "1W", base: "week", perp: "perpWeek" },
  { k: "1M", base: "month", perp: "perpMonth" },
  { k: "All", base: "allTime", perp: "perpAllTime" },
];

/* ── PnL area chart (SVG) ───────────────────────────────────────────────── */
function PnlChart({ points }: { points: [number, string][] }) {
  const W = 720, H = 240, P = 4;
  if (points.length < 2) return <div className="grid h-[240px] place-items-center text-sm text-slate-500">No history in this window.</div>;
  const ys = points.map((p) => num(p[1]));
  const min = Math.min(...ys, 0), max = Math.max(...ys, 0);
  const span = max - min || 1;
  const x = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P);
  const y = (v: number) => P + (1 - (v - min) / span) * (H - 2 * P);
  const line = points.map((p, i) => `${x(i)},${y(num(p[1]))}`).join(" ");
  const area = `M${x(0)},${y(0)} L` + line + ` L${x(points.length - 1)},${y(0)} Z`;
  const last = ys[ys.length - 1];
  const up = last >= 0;
  const col = up ? "#34d399" : "#f87171";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[240px] w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.28" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={P} y1={y(0)} x2={W - P} y2={y(0)} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" strokeWidth="1" />
      <path d={area} fill="url(#pg)" />
      <polyline points={line} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* ── main ────────────────────────────────────────────────────────────────── */
export default function WalletDashboard({ address }: { address: string }) {
  const [state, setState] = useState<{ marginSummary: { accountValue: string; totalNtlPos: string }; withdrawable: string; assetPositions: { position: Pos }[] } | null>(null);
  const [spot, setSpot] = useState<number>(0);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [fills, setFills] = useState<Fill[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [win, setWin] = useState<"1D" | "1W" | "1M" | "All">("1W");
  const [perp, setPerp] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      hl<typeof state>({ type: "clearinghouseState", user: address }),
      hl<{ balances: { coin: string; total: string; entryNtl?: string }[] }>({ type: "spotClearinghouseState", user: address }),
      hl<Portfolio>({ type: "portfolio", user: address }),
      hl<Fill[]>({ type: "userFills", user: address }),
    ]).then(([cs, sp, pf, fl]) => {
      if (!alive) return;
      setState(cs);
      setSpot((sp?.balances || []).reduce((s, b) => s + num(b.total) * (b.coin === "USDC" ? 1 : 0), 0));
      setPortfolio(pf);
      setFills(Array.isArray(fl) ? fl : []);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [address]);

  const positions = useMemo(
    () => (state?.assetPositions || []).map((p) => p.position).filter((p) => num(p.szi) !== 0).sort((a, b) => Math.abs(num(b.positionValue)) - Math.abs(num(a.positionValue))),
    [state],
  );

  const acctVal = num(state?.marginSummary.accountValue) + spot;
  const totalNtl = num(state?.marginSummary.totalNtlPos);
  const longVal = positions.filter((p) => num(p.szi) > 0).reduce((s, p) => s + num(p.positionValue), 0);
  const shortVal = positions.filter((p) => num(p.szi) < 0).reduce((s, p) => s + num(p.positionValue), 0);
  const uPnl = positions.reduce((s, p) => s + num(p.unrealizedPnl), 0);

  // Stats from recent fills.
  const stats = useMemo(() => {
    const closed = fills.filter((f) => num(f.closedPnl) !== 0);
    const wins = closed.filter((f) => num(f.closedPnl) > 0).length;
    const net = closed.reduce((s, f) => s + num(f.closedPnl), 0);
    const top = [...closed].sort((a, b) => num(b.closedPnl) - num(a.closedPnl)).slice(0, 6);
    return { count: closed.length, winRate: closed.length ? (wins / closed.length) * 100 : 0, net, top };
  }, [fills]);

  const chart = useMemo(() => {
    if (!portfolio) return null;
    const w = WINDOWS.find((x) => x.k === win)!;
    const name = perp ? w.perp : w.base;
    const entry = portfolio.find((p) => p[0] === name);
    return entry?.[1].pnlHistory || [];
  }, [portfolio, win, perp]);
  const chartPnl = chart && chart.length ? num(chart[chart.length - 1][1]) : 0;

  const copy = () => { navigator.clipboard?.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1200); };

  return (
    <div className="container py-8">
      {/* header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/whales" className="btn-ghost !px-3 !py-2 !text-sm"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-iris-500 text-xs font-bold text-ink-950">
          {address.slice(2, 4).toUpperCase()}
        </span>
        <span className="font-mono text-lg font-semibold text-white">{address.slice(0, 6)}…{address.slice(-4)}</span>
        <button onClick={copy} className="text-slate-400 hover:text-white">{copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}</button>
        <a href={`https://app.hyperliquid.xyz/trade/${address}`} target="_blank" rel="noreferrer" className="ml-auto btn-ghost !px-4 !py-2 !text-sm">Copy Trading ↗</a>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <>
          {/* account cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Account total value" value={compact(acctVal)} />
            <Card label="Free margin (withdrawable)" value={compact(num(state?.withdrawable))} />
            <Card label="Total position value" value={compact(totalNtl)} />
            <Card label="Recent win rate" value={`${stats.winRate.toFixed(1)}%`} sub={`${stats.count} closed · net ${compact(stats.net)}`} tone={stats.net >= 0 ? "text-ok" : "text-danger"} />
          </div>

          {/* PnL chart + bias */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            {/* bias */}
            <div className="glass p-5">
              <div className="text-sm font-bold text-white">Direction bias</div>
              <Bar label="Long exposure" v={longVal} total={longVal - shortVal || 1} tone="ok" />
              <Bar label="Short exposure" v={Math.abs(shortVal)} total={longVal - shortVal || 1} tone="danger" />
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-[11px] text-slate-400">Long value</div><div className="tabular font-semibold text-ok">{compact(longVal)}</div></div>
                <div className="text-right"><div className="text-[11px] text-slate-400">Short value</div><div className="tabular font-semibold text-danger">{compact(Math.abs(shortVal))}</div></div>
                <div><div className="text-[11px] text-slate-400">Unrealized PnL</div><div className={`tabular font-semibold ${uPnl >= 0 ? "text-ok" : "text-danger"}`}>{compact(uPnl)}</div></div>
                <div className="text-right"><div className="text-[11px] text-slate-400">Open positions</div><div className="tabular font-semibold text-white">{positions.length}</div></div>
              </div>
            </div>
            {/* chart */}
            <div className="glass p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] text-slate-400">{win} total PnL {perp ? "(perp)" : "(total)"}</div>
                  <div className={`tabular text-xl font-bold ${chartPnl >= 0 ? "text-ok" : "text-danger"}`}>{chartPnl >= 0 ? "+" : ""}{money(chartPnl)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-white/10 p-0.5 text-[11px]">
                    {(["perp", "total"] as const).map((m) => (
                      <button key={m} onClick={() => setPerp(m === "perp")} className={`rounded px-2 py-1 font-medium ${(m === "perp") === perp ? "bg-white/10 text-white" : "text-slate-500"}`}>{m === "perp" ? "Perp" : "Total"}</button>
                    ))}
                  </div>
                  <div className="flex rounded-lg border border-white/10 p-0.5 text-[11px]">
                    {WINDOWS.map((w) => (
                      <button key={w.k} onClick={() => setWin(w.k)} className={`rounded px-2 py-1 font-medium ${win === w.k ? "bg-brand-500/20 text-brand-300" : "text-slate-500"}`}>{w.k}</button>
                    ))}
                  </div>
                </div>
              </div>
              <PnlChart points={chart || []} />
            </div>
          </div>

          {/* positions */}
          <div className="mt-4 glass p-5">
            <div className="mb-3 text-sm font-bold text-white">Perp positions ({positions.length})</div>
            {positions.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">No open perp positions.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>{["Asset", "Side", "Size", "Entry", "Value", "uPnL", "ROE", "Liq.", "Lev"].map((h) => <th key={h} className="whitespace-nowrap py-2 pr-3 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="tabular">
                    {positions.map((p) => {
                      const long = num(p.szi) > 0, pnl = num(p.unrealizedPnl), roe = num(p.returnOnEquity) * 100;
                      return (
                        <tr key={p.coin} className="border-t border-white/[0.05]">
                          <td className="py-2 pr-3 font-semibold text-white">{p.coin}</td>
                          <td className="py-2 pr-3"><span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold ${long ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"}`}>{long ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{long ? "Long" : "Short"}</span></td>
                          <td className="py-2 pr-3 text-slate-300">{Math.abs(num(p.szi)).toLocaleString("en-US", { maximumFractionDigits: 4 })}</td>
                          <td className="py-2 pr-3 text-slate-300">{money(num(p.entryPx))}</td>
                          <td className="py-2 pr-3 text-slate-200">{compact(num(p.positionValue))}</td>
                          <td className={`py-2 pr-3 font-semibold ${pnl >= 0 ? "text-ok" : "text-danger"}`}>{compact(pnl)}</td>
                          <td className={`py-2 pr-3 ${roe >= 0 ? "text-ok" : "text-danger"}`}>{roe >= 0 ? "+" : ""}{roe.toFixed(1)}%</td>
                          <td className="py-2 pr-3 text-slate-400">{p.liquidationPx ? money(num(p.liquidationPx)) : "—"}</td>
                          <td className="py-2 pr-3 text-slate-400">{p.leverage?.value ?? "—"}×</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* top trades */}
          {stats.top.length > 0 && (
            <div className="mt-4 glass p-5">
              <div className="mb-3 text-sm font-bold text-white">Top recent closed trades</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stats.top.map((f, i) => {
                  const pnl = num(f.closedPnl);
                  return (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{f.coin}</span>
                        <span className="text-[11px] text-slate-500">{f.dir}</span>
                      </div>
                      <div className={`tabular mt-1.5 text-lg font-bold ${pnl >= 0 ? "text-ok" : "text-danger"}`}>{compact(pnl)}</div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-slate-500">Computed from Hyperliquid recent fills (closed-PnL). Not a full lifetime history.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="glass p-4">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`tabular mt-0.5 text-xl font-bold ${tone || "text-white"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

function Bar({ label, v, total, tone }: { label: string; v: number; total: number; tone: "ok" | "danger" }) {
  const pct = Math.max(0, Math.min(100, (v / (Math.abs(total) || 1)) * 100));
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className={`tabular ${tone === "ok" ? "text-ok" : "text-danger"}`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${tone === "ok" ? "bg-ok" : "bg-danger"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

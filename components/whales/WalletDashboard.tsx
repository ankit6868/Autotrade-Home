"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Copy, Check, Loader2, BarChart3, Bell, Users, Clock,
} from "lucide-react";
import {
  n, money, compact, signed, pct, sizeFmt, ago, fmtDuration,
  groupTrades, computeStats, maxDrawdown, filterWindow, windowMs,
  type Fill, type Trade, type Window,
} from "@/lib/whale";
import { Donut, Bar, Dropdown } from "./ui";
import TradingStatsModal from "./TradingStatsModal";

/* ── HL response types ───────────────────────────────────────────────────── */
type Pos = {
  coin: string; szi: string; entryPx: string; positionValue: string; unrealizedPnl: string;
  returnOnEquity: string; liquidationPx: string | null; leverage: { value: number; type: string };
  marginUsed: string; cumFunding?: { sinceOpen: string };
};
type State = {
  withdrawable: string;
  marginSummary: { accountValue: string; totalNtlPos: string; totalMarginUsed: string };
  assetPositions: { position: Pos }[];
};
type SpotBal = { coin: string; total: string; entryNtl?: string };
type Portfolio = [string, { accountValueHistory: [number, string][]; pnlHistory: [number, string][] }][];
type OpenOrder = { coin: string; side: string; limitPx: string; sz: string; timestamp: number; orderType?: string };
type Funding = { time: number; delta: { coin: string; usdc: string; fundingRate: string; szi: string } };
type HistOrder = { order: { coin: string; side: string; limitPx: string; sz: string; origSz: string; orderType?: string; timestamp: number; reduceOnly?: boolean }; status: string; statusTimestamp: number };
type Twap = { fill: { coin: string; px: string; sz: string; side: string; time: number } };
type Ledger = { time: number; delta: { type: string; usdc?: string; amount?: string; token?: string } };

async function hl<T>(body: object): Promise<T | null> {
  try {
    const r = await fetch("/api/hl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

const TIME_OPTS = [{ label: "1D", value: "1D" as Window }, { label: "1W", value: "1W" as Window }, { label: "1M", value: "1M" as Window }, { label: "All", value: "All" as Window }];
const SCOPE_OPTS = [{ label: "Perp Only", value: "perp" }, { label: "Total", value: "total" }];
const METRIC_OPTS = [{ label: "Total PnL", value: "pnl" }, { label: "Account Value", value: "value" }];
const WIN_NAME: Record<Window, [string, string]> = { "1D": ["day", "perpDay"], "1W": ["week", "perpWeek"], "1M": ["month", "perpMonth"], All: ["allTime", "perpAllTime"] };

const TABS = ["Spot Holdings", "Perp Positions", "Open Orders", "Recent Fills", "Completed Trades", "Historical Orders", "Funding History", "TWAP", "Deposits & Withdrawals"] as const;
type Tab = (typeof TABS)[number];

/* ── two-color PnL area chart ────────────────────────────────────────────── */
function PnlChart({ points, height = 300 }: { points: [number, string][]; height?: number }) {
  const W = 800, RIGHT = 78, P = 10;
  const plotW = W - RIGHT;
  if (!points || points.length < 2)
    return <div className="grid place-items-center text-sm text-slate-500" style={{ height }}>No history in this window.</div>;
  const ys = points.map((p) => n(p[1]));
  let min = Math.min(...ys, 0), max = Math.max(...ys, 0);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const x = (i: number) => P + (i / (points.length - 1)) * (plotW - 2 * P);
  const y = (v: number) => P + (1 - (v - min) / span) * (height - 2 * P);
  const zeroY = y(0);
  const line = points.map((p, i) => `${x(i)},${y(n(p[1]))}`).join(" ");
  const area = `M${x(0)},${zeroY} L${line} L${x(points.length - 1)},${zeroY} Z`;
  const last = ys[ys.length - 1];
  const ticks = Array.from({ length: 6 }, (_, i) => max - (span * i) / 5);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="gpos" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity="0.28" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" /></linearGradient>
        <linearGradient id="gneg" x1="0" x2="0" y1="1" y2="0"><stop offset="0%" stopColor="#f87171" stopOpacity="0.28" /><stop offset="100%" stopColor="#f87171" stopOpacity="0" /></linearGradient>
        <clipPath id="clipAbove"><rect x="0" y="0" width={W} height={Math.max(0, zeroY)} /></clipPath>
        <clipPath id="clipBelow"><rect x="0" y={zeroY} width={W} height={Math.max(0, height - zeroY)} /></clipPath>
      </defs>
      {ticks.map((tv, i) => {
        const yy = y(tv);
        return (
          <g key={i}>
            <line x1={P} y1={yy} x2={plotW} y2={yy} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={W - 4} y={yy + 3} textAnchor="end" fill="#64748b" fontSize="10">{compact(tv)}</text>
          </g>
        );
      })}
      <line x1={P} y1={zeroY} x2={plotW} y2={zeroY} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" strokeWidth="1" />
      <path d={area} fill="url(#gpos)" clipPath="url(#clipAbove)" />
      <path d={area} fill="url(#gneg)" clipPath="url(#clipBelow)" />
      <polyline points={line} fill="none" stroke="#34d399" strokeWidth="2" strokeLinejoin="round" clipPath="url(#clipAbove)" />
      <polyline points={line} fill="none" stroke="#f87171" strokeWidth="2" strokeLinejoin="round" clipPath="url(#clipBelow)" />
      <g>
        <rect x={plotW - 2} y={Math.min(height - 18, Math.max(0, y(last) - 9))} width={72} height={18} rx={4} fill={last >= 0 ? "#065f46" : "#7f1d1d"} />
        <text x={plotW + 34} y={Math.min(height - 5, Math.max(13, y(last) + 3))} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">{compact(last)}</text>
      </g>
    </svg>
  );
}

/* ── main dashboard ──────────────────────────────────────────────────────── */
export default function WalletDashboard({ address }: { address: string }) {
  const [state, setState] = useState<State | null>(null);
  const [spot, setSpot] = useState<SpotBal[]>([]);
  const [mids, setMids] = useState<Record<string, string>>({});
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [fills, setFills] = useState<Fill[]>([]);
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [funding, setFunding] = useState<Funding[]>([]);
  const [histOrders, setHistOrders] = useState<HistOrder[]>([]);
  const [twap, setTwap] = useState<Twap[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [monitored, setMonitored] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [win, setWin] = useState<Window>("1W");
  const [scope, setScope] = useState("perp");
  const [metric, setMetric] = useState("pnl");
  const [tab, setTab] = useState<Tab>("Perp Positions");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      hl<State>({ type: "clearinghouseState", user: address }),
      hl<{ balances: SpotBal[] }>({ type: "spotClearinghouseState", user: address }),
      hl<Record<string, string>>({ type: "allMids" }),
      hl<Portfolio>({ type: "portfolio", user: address }),
      hl<Fill[]>({ type: "userFills", user: address }),
      hl<OpenOrder[]>({ type: "frontendOpenOrders", user: address }),
      hl<Funding[]>({ type: "userFunding", user: address, startTime: Date.now() - 30 * 86_400_000 }),
      hl<HistOrder[]>({ type: "historicalOrders", user: address }),
      hl<Twap[]>({ type: "userTwapSliceFills", user: address }),
      hl<Ledger[]>({ type: "userNonFundingLedgerUpdates", user: address, startTime: Date.now() - 90 * 86_400_000 }),
    ]).then(([cs, sp, md, pf, fl, oo, fn, ho, tw, lg]) => {
      if (!alive) return;
      setState(cs);
      setSpot((sp?.balances || []).filter((b) => n(b.total) > 0));
      setMids(md || {});
      setPortfolio(pf);
      setFills(Array.isArray(fl) ? fl : []);
      setOrders(Array.isArray(oo) ? oo : []);
      setFunding(Array.isArray(fn) ? fn : []);
      setHistOrders(Array.isArray(ho) ? ho : []);
      setTwap(Array.isArray(tw) ? tw : []);
      setLedger(Array.isArray(lg) ? lg : []);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [address]);

  useEffect(() => {
    try { setMonitored((JSON.parse(localStorage.getItem("whale_watch") || "[]") as string[]).includes(address)); } catch {}
  }, [address]);

  const positions = useMemo(
    () => (state?.assetPositions || []).map((p) => p.position).filter((p) => n(p.szi) !== 0)
      .sort((a, b) => Math.abs(n(b.positionValue)) - Math.abs(n(a.positionValue))),
    [state],
  );
  const trades = useMemo(() => groupTrades(fills), [fills]);

  const mid = (coin: string) => n(mids[coin]);
  const spotValue = spot.reduce((s, b) => s + n(b.total) * (b.coin === "USDC" ? 1 : mid(b.coin) || (n(b.total) ? n(b.entryNtl) / n(b.total) : 0)), 0);

  const perpVal = n(state?.marginSummary.accountValue);
  const acctTotal = perpVal + spotValue;
  const withdrawable = n(state?.withdrawable);
  const totalNtl = n(state?.marginSummary.totalNtlPos);
  const marginUsed = n(state?.marginSummary.totalMarginUsed);
  const leverage = perpVal > 0 ? totalNtl / perpVal : 0;

  const longVal = positions.filter((p) => n(p.szi) > 0).reduce((s, p) => s + n(p.positionValue), 0);
  const shortVal = positions.filter((p) => n(p.szi) < 0).reduce((s, p) => s + Math.abs(n(p.positionValue)), 0);
  const expTotal = longVal + shortVal || 1;
  const longPct = (longVal / expTotal) * 100;
  const shortPct = 100 - longPct;
  const bias = longPct >= 65 ? "Long biased" : shortPct >= 65 ? "Short biased" : "Neutral";
  const uPnl = positions.reduce((s, p) => s + n(p.unrealizedPnl), 0);
  const roe = marginUsed > 0 ? (uPnl / marginUsed) * 100 : 0;

  const [totalName, perpName] = WIN_NAME[win];
  const chartName = scope === "perp" ? perpName : totalName;
  const chartEntry = portfolio?.find((p) => p[0] === chartName);
  const chartSeries = (metric === "value" ? chartEntry?.[1].accountValueHistory : chartEntry?.[1].pnlHistory) || [];
  const chartLast = chartSeries.length ? n(chartSeries[chartSeries.length - 1][1]) : 0;
  const perfTrades = useMemo(() => filterWindow(trades, win), [trades, win]);
  const perf = useMemo(() => computeStats(perfTrades), [perfTrades]);
  const cutoff = Date.now() - windowMs(win);
  const tradeCount = fills.filter((f) => f.time >= cutoff).length;
  const mdd = maxDrawdown(chartEntry?.[1].accountValueHistory);

  // Derived trader tags (from real fills / drawdown / exposure).
  const allStats = useMemo(() => computeStats(trades), [trades]);
  const allMdd = maxDrawdown(portfolio?.find((p) => p[0] === "perpAllTime")?.[1].accountValueHistory);
  const tags = useMemo(() => deriveTags(allStats, allMdd, longPct, positions.length), [allStats, allMdd, longPct, positions.length]);

  const copy = () => { navigator.clipboard?.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  const toggleMonitor = () => {
    try {
      const set = new Set(JSON.parse(localStorage.getItem("whale_watch") || "[]") as string[]);
      if (set.has(address)) set.delete(address); else set.add(address);
      localStorage.setItem("whale_watch", JSON.stringify(Array.from(set)));
      setMonitored(set.has(address));
    } catch {}
  };

  return (
    <div className="container py-8">
      {/* header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/whales" className="btn-ghost !px-3 !py-2 !text-sm"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-iris-500 text-xs font-bold text-ink-950">{address.slice(2, 4).toUpperCase()}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-semibold text-white">{address.slice(0, 6)}…{address.slice(-4)}</span>
            <button onClick={copy} className="text-slate-400 hover:text-white">{copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}</button>
          </div>
          {tags.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-semibold">
              {tags.map(([label, tone]) => <span key={label} className={TAG_TONE[tone]}>{label}</span>)}
            </div>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button onClick={() => setShowStats(true)} className="btn-ghost !px-3.5 !py-2 !text-[13px]"><BarChart3 className="h-4 w-4" /> Trading Statistics</button>
          <button onClick={toggleMonitor} className={`btn-ghost !px-3.5 !py-2 !text-[13px] ${monitored ? "!border-brand-400/50 !text-brand-300" : ""}`}>
            {monitored ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />} {monitored ? "Monitoring" : "One-click Monitor"}
          </button>
          <a href="https://app.hyperliquid.xyz/trade" target="_blank" rel="noreferrer" className="btn-primary !px-3.5 !py-2 !text-[13px]"><Users className="h-4 w-4" /> Copy Trading</a>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <>
          {/* account cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass flex items-center justify-between p-4">
              <div>
                <div className="text-[11px] text-slate-400">Account Total Value</div>
                <div className="tabular mt-0.5 text-xl font-bold text-white">{money(acctTotal)}</div>
                <div className="mt-2 space-y-0.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-400"><i className="h-2 w-2 rounded-full bg-brand-400" />Perpetual<span className="ml-auto tabular text-slate-300">{compact(perpVal)}</span></div>
                  <div className="flex items-center gap-1.5 text-slate-400"><i className="h-2 w-2 rounded-full bg-iris-400" />Spot<span className="ml-auto tabular text-slate-300">{compact(spotValue)}</span></div>
                </div>
              </div>
              <Donut value={acctTotal > 0 ? (perpVal / acctTotal) * 100 : 0} color="#38bdf8" />
            </div>

            <div className="glass flex items-center justify-between p-4">
              <div>
                <div className="text-[11px] text-slate-400">Free margin available</div>
                <div className="tabular mt-0.5 text-xl font-bold text-white">{money(withdrawable)}</div>
                <div className="mt-2 text-[11px] text-slate-400">Withdrawable<span className="ml-2 tabular text-slate-300">{pct(perpVal > 0 ? (withdrawable / perpVal) * 100 : 0)}</span></div>
              </div>
              <Donut value={perpVal > 0 ? (withdrawable / perpVal) * 100 : 0} color="#a78bfa" />
            </div>

            <div className="glass flex items-center justify-between p-4">
              <div>
                <div className="text-[11px] text-slate-400">Total Position Value</div>
                <div className="tabular mt-0.5 text-xl font-bold text-white">{money(totalNtl)}</div>
                <div className="mt-2 text-[11px] text-slate-400">Leverage Ratio<span className="ml-2 tabular text-slate-300">{leverage.toFixed(2)}x</span></div>
              </div>
              <Donut value={perpVal > 0 ? Math.min(100, (marginUsed / perpVal) * 100) : 0} color="#fbbf24" />
            </div>

            <div className="glass p-4">
              <div className="text-[11px] text-slate-400">Trading Performance ({win})</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                <div><div className="text-[10px] text-slate-500">Win Rate</div><div className={`tabular font-bold ${perf.winRate >= 50 ? "text-ok" : "text-white"}`}>{pct(perf.winRate)}</div></div>
                <div><div className="text-[10px] text-slate-500">Max Drawdown</div><div className="tabular font-bold text-danger">{pct(mdd)}</div></div>
                <div className="flex items-center gap-1.5 text-slate-400"><i className="h-1.5 w-1.5 rounded-full bg-brand-400" />Trades<span className="ml-auto tabular text-slate-200">{tradeCount}</span></div>
                <div className="flex items-center gap-1.5 text-slate-400"><i className="h-1.5 w-1.5 rounded-full bg-ok" />Closed<span className="ml-auto tabular text-slate-200">{perf.count}</span></div>
              </div>
            </div>
          </div>

          {/* perp panel + chart */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="glass p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Perp Total Value</span>
                <span className="rounded bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-400">Current Positions</span>
              </div>
              <div className="tabular text-xl font-bold text-white">{money(totalNtl)}</div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px]"><span className="text-slate-400">Average Margin Used Ratio</span><span className="tabular text-slate-300">{pct(perpVal > 0 ? Math.min(100, (marginUsed / perpVal) * 100) : 0, 0)}</span></div>
                <Bar value={perpVal > 0 ? (marginUsed / perpVal) * 100 : 0} tone="brand" />
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px]"><span className="font-semibold text-white">Direction Bias</span><span className="text-slate-400">{bias}</span></div>
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-[11px]"><span className="text-slate-400">Long Exposure</span><span className="tabular text-ok">{pct(longPct, 0)}</span></div>
                <Bar value={longPct} tone="ok" />
              </div>
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-[11px]"><span className="text-slate-400">Short Exposure</span><span className="tabular text-danger">{pct(shortPct, 0)}</span></div>
                <Bar value={shortPct} tone="danger" />
              </div>

              <div className="mt-4 text-[11px] font-semibold text-white">Position Distribution</div>
              <div className="mb-1 mt-1 flex justify-between text-[11px]"><span className="text-slate-400">Long <span className="tabular text-ok">{compact(longVal)}</span></span><span className="text-slate-400">Short <span className="tabular text-danger">{compact(shortVal)}</span></span></div>
              <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full bg-ok" style={{ width: `${longPct}%` }} />
                <div className="h-full bg-danger" style={{ width: `${shortPct}%` }} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3 text-[13px]">
                <div><div className="text-[10px] text-slate-500">ROE</div><div className={`tabular font-semibold ${roe >= 0 ? "text-ok" : "text-danger"}`}>{roe >= 0 ? "+" : ""}{pct(roe)}</div></div>
                <div className="text-right"><div className="text-[10px] text-slate-500">uPnL</div><div className={`tabular font-semibold ${uPnl >= 0 ? "text-ok" : "text-danger"}`}>{signed(uPnl)}</div></div>
              </div>
            </div>

            <div className="glass p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] text-slate-400">{win} {metric === "value" ? "Account Value" : "Total PnL"} ({scope === "perp" ? "Perp Only" : "Total"})</div>
                  <div className={`tabular text-xl font-bold ${chartLast >= 0 ? "text-ok" : "text-danger"}`}>{metric === "value" ? money(chartLast) : signed(chartLast)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Dropdown value={win} options={TIME_OPTS} onChange={setWin} icon={<Clock className="h-3.5 w-3.5 text-slate-400" />} />
                  <Dropdown value={scope} options={SCOPE_OPTS} onChange={setScope} />
                  <Dropdown value={metric} options={METRIC_OPTS} onChange={setMetric} />
                </div>
              </div>
              <PnlChart points={chartSeries} />
            </div>
          </div>

          {/* tabs */}
          <div className="mt-4 glass overflow-hidden">
            <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-2">
              {TABS.map((t) => {
                const count = t === "Spot Holdings" ? spot.length : t === "Perp Positions" ? positions.length : t === "Open Orders" ? orders.length : t === "Completed Trades" ? trades.length : t === "Historical Orders" ? histOrders.length : t === "Funding History" ? funding.length : t === "TWAP" ? twap.length : t === "Deposits & Withdrawals" ? ledger.length : undefined;
                return (
                  <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-[13px] font-semibold transition-colors ${tab === t ? "border-brand-400 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                    {t}{count != null ? ` (${count})` : ""}
                  </button>
                );
              })}
            </div>
            <div className="overflow-x-auto p-1">{renderTab(tab, { positions, spot, mid, orders, fills, trades, funding, histOrders, twap, ledger })}</div>
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            Live from Hyperliquid&apos;s public API · read-only, no sign-up. Trade stats are computed from recent fills — long windows may be partial.
          </p>
        </>
      )}

      {showStats && <TradingStatsModal address={address} trades={trades} onClose={() => setShowStats(false)} />}
    </div>
  );
}

/* ── tab bodies ──────────────────────────────────────────────────────────── */
function renderTab(
  tab: Tab,
  d: { positions: Pos[]; spot: SpotBal[]; mid: (c: string) => number; orders: OpenOrder[]; fills: Fill[]; trades: Trade[]; funding: Funding[]; histOrders: HistOrder[]; twap: Twap[]; ledger: Ledger[] },
) {
  const H = ({ cols }: { cols: string[] }) => (
    <thead className="text-[11px] uppercase tracking-wide text-slate-500">
      <tr>{cols.map((c, i) => <th key={c} className={`whitespace-nowrap px-3 py-2.5 font-semibold ${i === 0 ? "text-left" : "text-right"}`}>{c}</th>)}</tr>
    </thead>
  );
  const empty = (msg: string) => <div className="py-10 text-center text-sm text-slate-500">{msg}</div>;

  if (tab === "Spot Holdings")
    return d.spot.length === 0 ? empty("No spot holdings.") : (
      <table className="w-full text-[13px]">
        <H cols={["Asset", "Balance", "Value"]} />
        <tbody className="tabular">
          {d.spot.map((b) => (
            <tr key={b.coin} className="border-t border-white/[0.05]">
              <td className="px-3 py-2.5 text-left font-semibold text-white">{b.coin}</td>
              <td className="px-3 py-2.5 text-right text-slate-300">{sizeFmt(n(b.total))}</td>
              <td className="px-3 py-2.5 text-right text-slate-200">{money(n(b.total) * (b.coin === "USDC" ? 1 : d.mid(b.coin)))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  if (tab === "Perp Positions")
    return d.positions.length === 0 ? empty("No open perp positions.") : (
      <table className="w-full text-[13px]">
        <H cols={["Symbol", "Position Value", "uPnL", "Entry Avg.", "Mark", "Liq.", "Margin", "Funding", "TP/SL"]} />
        <tbody className="tabular">
          {d.positions.map((p) => {
            const long = n(p.szi) > 0, pnl = n(p.unrealizedPnl), r = n(p.returnOnEquity) * 100;
            return (
              <tr key={p.coin} className="border-t border-white/[0.05]">
                <td className="px-3 py-2.5 text-left">
                  <span className={`mr-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${long ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"}`}>{long ? "Long" : "Short"}</span>
                  <span className="font-semibold text-white">{p.coin}</span>
                  <span className="ml-1 text-[10px] text-slate-500">{p.leverage?.type === "isolated" ? "Isolated" : "Cross"} {p.leverage?.value}x</span>
                </td>
                <td className="px-3 py-2.5 text-right text-slate-200">{money(n(p.positionValue))}<div className="text-[10px] text-slate-500">{sizeFmt(n(p.szi))} {p.coin}</div></td>
                <td className={`px-3 py-2.5 text-right font-semibold ${pnl >= 0 ? "text-ok" : "text-danger"}`}>{signed(pnl)}<div className="text-[10px] opacity-80">{r >= 0 ? "+" : ""}{r.toFixed(2)}%</div></td>
                <td className="px-3 py-2.5 text-right text-slate-300">{money(n(p.entryPx))}</td>
                <td className="px-3 py-2.5 text-right text-slate-300">{d.mid(p.coin) ? money(d.mid(p.coin)) : "—"}</td>
                <td className="px-3 py-2.5 text-right text-slate-400">{p.liquidationPx ? money(n(p.liquidationPx)) : "—"}</td>
                <td className="px-3 py-2.5 text-right text-slate-300">{money(n(p.marginUsed))}</td>
                <td className="px-3 py-2.5 text-right text-slate-400">{p.cumFunding ? money(-n(p.cumFunding.sinceOpen)) : "—"}</td>
                <td className="px-3 py-2.5 text-right text-slate-500">-/-</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );

  if (tab === "Open Orders")
    return d.orders.length === 0 ? empty("No open orders.") : (
      <table className="w-full text-[13px]">
        <H cols={["Asset", "Side", "Price", "Size", "Placed"]} />
        <tbody className="tabular">
          {d.orders.map((o, i) => (
            <tr key={i} className="border-t border-white/[0.05]">
              <td className="px-3 py-2.5 text-left font-semibold text-white">{o.coin}</td>
              <td className={`px-3 py-2.5 text-right font-semibold ${o.side === "B" ? "text-ok" : "text-danger"}`}>{o.side === "B" ? "Buy" : "Sell"}</td>
              <td className="px-3 py-2.5 text-right text-slate-300">{money(n(o.limitPx))}</td>
              <td className="px-3 py-2.5 text-right text-slate-300">{sizeFmt(n(o.sz))}</td>
              <td className="px-3 py-2.5 text-right text-slate-500">{ago(o.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  if (tab === "Recent Fills")
    return d.fills.length === 0 ? empty("No recent fills.") : (
      <table className="w-full text-[13px]">
        <H cols={["Time", "Asset", "Direction", "Price", "Size", "Closed PnL", "Fee"]} />
        <tbody className="tabular">
          {d.fills.slice(0, 60).map((f, i) => {
            const cp = n(f.closedPnl);
            return (
              <tr key={i} className="border-t border-white/[0.05]">
                <td className="px-3 py-2.5 text-left text-slate-400">{ago(f.time)}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-white">{f.coin}</td>
                <td className="px-3 py-2.5 text-right text-slate-300">{f.dir}</td>
                <td className="px-3 py-2.5 text-right text-slate-300">{money(n(f.px))}</td>
                <td className="px-3 py-2.5 text-right text-slate-300">{sizeFmt(n(f.sz))}</td>
                <td className={`px-3 py-2.5 text-right ${cp > 0 ? "text-ok" : cp < 0 ? "text-danger" : "text-slate-500"}`}>{cp !== 0 ? signed(cp) : "—"}</td>
                <td className="px-3 py-2.5 text-right text-slate-500">{money(n(f.fee))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );

  if (tab === "Completed Trades")
    return d.trades.length === 0 ? empty("No completed trades in recent fills.") : (
      <table className="w-full text-[13px]">
        <H cols={["Closed", "Asset", "Side", "Size", "Gross PnL", "Fees", "Net PnL", "Duration"]} />
        <tbody className="tabular">
          {d.trades.slice(0, 60).map((t, i) => (
            <tr key={i} className="border-t border-white/[0.05]">
              <td className="px-3 py-2.5 text-left text-slate-400">{ago(t.closeTime)}</td>
              <td className="px-3 py-2.5 text-right font-semibold text-white">{t.coin}</td>
              <td className="px-3 py-2.5 text-right"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.side === "Long" ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"}`}>{t.side}</span></td>
              <td className="px-3 py-2.5 text-right text-slate-300">{sizeFmt(t.size)}</td>
              <td className={`px-3 py-2.5 text-right ${t.realized >= 0 ? "text-ok" : "text-danger"}`}>{signed(t.realized)}</td>
              <td className="px-3 py-2.5 text-right text-slate-400">{money(t.fees)}</td>
              <td className={`px-3 py-2.5 text-right font-semibold ${t.net >= 0 ? "text-ok" : "text-danger"}`}>{signed(t.net)}</td>
              <td className="px-3 py-2.5 text-right text-slate-400">{fmtDuration(t.durationMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  if (tab === "Historical Orders")
    return d.histOrders.length === 0 ? empty("No recent orders.") : (
      <table className="w-full text-[13px]">
        <H cols={["Time", "Asset", "Side", "Type", "Price", "Size", "Status"]} />
        <tbody className="tabular">
          {d.histOrders.slice(0, 60).map((h, i) => {
            const o = h.order;
            return (
              <tr key={i} className="border-t border-white/[0.05]">
                <td className="px-3 py-2.5 text-left text-slate-400">{ago(h.statusTimestamp || o.timestamp)}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-white">{o.coin}</td>
                <td className={`px-3 py-2.5 text-right font-semibold ${o.side === "B" ? "text-ok" : "text-danger"}`}>{o.side === "B" ? "Buy" : "Sell"}</td>
                <td className="px-3 py-2.5 text-right text-slate-400">{o.orderType || "—"}{o.reduceOnly ? " · RO" : ""}</td>
                <td className="px-3 py-2.5 text-right text-slate-300">{money(n(o.limitPx))}</td>
                <td className="px-3 py-2.5 text-right text-slate-300">{sizeFmt(n(o.origSz || o.sz))}</td>
                <td className="px-3 py-2.5 text-right capitalize text-slate-400">{h.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );

  if (tab === "Funding History")
    return d.funding.length === 0 ? empty("No funding payments in the last 30 days.") : (
      <table className="w-full text-[13px]">
        <H cols={["Time", "Asset", "Payment", "Rate"]} />
        <tbody className="tabular">
          {d.funding.slice(0, 60).map((f, i) => {
            const usd = n(f.delta?.usdc);
            return (
              <tr key={i} className="border-t border-white/[0.05]">
                <td className="px-3 py-2.5 text-left text-slate-400">{ago(f.time)}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-white">{f.delta?.coin}</td>
                <td className={`px-3 py-2.5 text-right ${usd >= 0 ? "text-ok" : "text-danger"}`}>{signed(usd, 4)}</td>
                <td className="px-3 py-2.5 text-right text-slate-400">{(n(f.delta?.fundingRate) * 100).toFixed(4)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );

  if (tab === "TWAP")
    return d.twap.length === 0 ? empty("No TWAP orders in recent activity.") : (
      <table className="w-full text-[13px]">
        <H cols={["Time", "Asset", "Side", "Price", "Size"]} />
        <tbody className="tabular">
          {d.twap.slice(0, 60).map((t, i) => (
            <tr key={i} className="border-t border-white/[0.05]">
              <td className="px-3 py-2.5 text-left text-slate-400">{ago(t.fill?.time)}</td>
              <td className="px-3 py-2.5 text-right font-semibold text-white">{t.fill?.coin}</td>
              <td className={`px-3 py-2.5 text-right font-semibold ${t.fill?.side === "B" ? "text-ok" : "text-danger"}`}>{t.fill?.side === "B" ? "Buy" : "Sell"}</td>
              <td className="px-3 py-2.5 text-right text-slate-300">{money(n(t.fill?.px))}</td>
              <td className="px-3 py-2.5 text-right text-slate-300">{sizeFmt(n(t.fill?.sz))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  // Deposits & Withdrawals (non-funding ledger)
  return d.ledger.length === 0 ? empty("No deposits, withdrawals or transfers in the last 90 days.") : (
    <table className="w-full text-[13px]">
      <H cols={["Time", "Type", "Amount"]} />
      <tbody className="tabular">
        {d.ledger.slice(0, 60).map((l, i) => {
          const amt = n(l.delta?.usdc ?? l.delta?.amount);
          const outgoing = /send|withdraw/i.test(l.delta?.type || "");
          const val = outgoing ? -Math.abs(amt) : amt;
          return (
            <tr key={i} className="border-t border-white/[0.05]">
              <td className="px-3 py-2.5 text-left text-slate-400">{ago(l.time)}</td>
              <td className="px-3 py-2.5 text-right capitalize text-slate-300">{(l.delta?.type || "—").replace(/([A-Z])/g, " $1").trim()}</td>
              <td className={`px-3 py-2.5 text-right font-semibold ${val >= 0 ? "text-ok" : "text-danger"}`}>{signed(val)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── trader tags (derived from real data) ───────────────────────────────── */
const TAG_TONE: Record<string, string> = {
  ok: "text-ok", danger: "text-danger", brand: "text-brand-300", iris: "text-iris-400", slate: "text-slate-400",
};

function deriveTags(
  s: ReturnType<typeof computeStats>,
  mdd: number,
  longPct: number,
  openCount: number,
): [string, string][] {
  const tags: [string, string][] = [];
  if (openCount > 0) {
    if (longPct >= 65) tags.push(["Bullish", "ok"]);
    else if (longPct <= 35) tags.push(["Bearish", "danger"]);
    else tags.push(["Neutral", "slate"]);
  }
  if (s.count >= 3) {
    if (s.winRate >= 60) tags.push(["Shark", "brand"]);
    else if (s.winRate <= 35) tags.push(["Struggling", "danger"]);
    const h = s.avgHold;
    if (h > 0 && h < 3_600_000) tags.push(["Scalper", "iris"]);
    else if (h >= 86_400_000) tags.push(["Swinger", "iris"]);
    else if (h > 0) tags.push(["Day Trader", "iris"]);
    if (Math.abs(s.net) < 500) tags.push(["Breakeven", "slate"]);
    else if (s.net >= 5000) tags.push(["Big Gain", "ok"]);
    else if (s.net > 0) tags.push(["Small Gain", "ok"]);
    else tags.push(["In Loss", "danger"]);
  }
  if (mdd > 0) {
    if (mdd < 20) tags.push(["Low DD", "ok"]);
    else if (mdd > 60) tags.push(["High DD", "danger"]);
  }
  return tags;
}

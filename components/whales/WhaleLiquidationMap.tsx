"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Flame } from "lucide-react";
import { trackedAddresses, fetchWhaleStates, type WhaleState } from "@/lib/hlPos";
import { compact, n } from "@/lib/whale";
import { Dropdown } from "./ui";

type Candle = { t: number; o: number; h: number; l: number; c: number };
type Level = { price: number; value: number; long: boolean };
type View = "heatmap" | "cascade" | "levels";

const priceFmt = (v: number) => "$" + v.toLocaleString("en-US", { maximumFractionDigits: v >= 100 ? 0 : 4 });
const tLabel = (t: number) => {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const TF = {
  "24H": { interval: "15m", ms: 24 * 3600e3 },
  "3D": { interval: "1h", ms: 3 * 24 * 3600e3 },
  "7D": { interval: "4h", ms: 7 * 24 * 3600e3 },
} as const;
type TfKey = keyof typeof TF;
const TF_OPTS = (Object.keys(TF) as TfKey[]).map((k) => ({ label: k, value: k }));
const VIEW_OPTS: { label: string; value: View }[] = [
  { label: "Heatmap", value: "heatmap" },
  { label: "Cascade", value: "cascade" },
  { label: "Levels", value: "levels" },
];

// viridis-style colormap (magnitude → colour), matching the heatmap look.
const STOPS = [[68, 1, 84], [59, 82, 139], [33, 144, 141], [93, 201, 99], [253, 231, 37]];
function colormap(t: number) {
  t = Math.max(0, Math.min(1, t));
  const x = t * (STOPS.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = STOPS[i];
  const b = STOPS[Math.min(STOPS.length - 1, i + 1)];
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
}

export default function WhaleLiquidationMap() {
  const [states, setStates] = useState<WhaleState[]>([]);
  const [mids, setMids] = useState<Record<string, string>>({});
  const [candles, setCandles] = useState<Candle[]>([]);
  const [coin, setCoin] = useState("");
  const [tf, setTf] = useState<TfKey>("24H");
  const [view, setView] = useState<View>("heatmap");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const runStates = async (force: boolean) => {
      const st = await fetchWhaleStates(trackedAddresses(100), force);
      if (alive) { setStates(st.filter((s) => s.positions.length > 0)); setLoading(false); }
    };
    const runMids = async () => {
      try {
        const r = await fetch("/api/hl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "allMids" }) });
        const d = await r.json();
        if (alive) setMids(d || {});
      } catch { /* ignore */ }
    };
    runStates(false); runMids();
    const a = setInterval(() => runStates(false), 20_000);
    const b = setInterval(() => runStates(true), 60_000);
    const c = setInterval(runMids, 30_000);
    return () => { alive = false; clearInterval(a); clearInterval(b); clearInterval(c); };
  }, []);

  const coinOpts = useMemo(() => {
    const byCoin: Record<string, number> = {};
    for (const s of states) for (const p of s.positions) if (p.liqPx) byCoin[p.coin] = (byCoin[p.coin] || 0) + p.value;
    return Object.entries(byCoin).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c]) => ({ label: c, value: c }));
  }, [states]);

  useEffect(() => { if (!coin && coinOpts.length) setCoin(coinOpts[0].value); }, [coin, coinOpts]);

  // candles for the heatmap
  useEffect(() => {
    if (!coin) return;
    let alive = true;
    (async () => {
      const { interval, ms } = TF[tf];
      const end = Date.now();
      try {
        const r = await fetch("/api/hl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "candleSnapshot", req: { coin, interval, startTime: end - ms, endTime: end } }) });
        const d = await r.json();
        if (alive) setCandles(Array.isArray(d) ? d.map((k: { t: number; o: string; h: string; l: string; c: string }) => ({ t: k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c })) : []);
      } catch { if (alive) setCandles([]); }
    })();
    return () => { alive = false; };
  }, [coin, tf]);

  const levels: Level[] = useMemo(
    () => states.flatMap((s) => s.positions).filter((p) => p.coin === coin && p.liqPx && p.liqPx > 0).map((p) => ({ price: p.liqPx as number, value: p.value, long: p.szi > 0 })),
    [states, coin],
  );
  const mark = n(mids[coin]);
  const longTotal = levels.filter((l) => l.long).reduce((s, l) => s + l.value, 0);
  const shortTotal = levels.filter((l) => !l.long).reduce((s, l) => s + l.value, 0);

  const empty = coinOpts.length === 0;

  return (
    <div className="glass p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Flame className="h-4 w-4 text-warn" /> Whale Liquidation Map</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10 p-0.5 text-[11px]">
            {VIEW_OPTS.map((v) => (
              <button key={v.value} onClick={() => setView(v.value)} className={`rounded px-2.5 py-1 font-medium ${view === v.value ? "bg-brand-500/20 text-brand-300" : "text-slate-500 hover:text-slate-300"}`}>{v.label}</button>
            ))}
          </div>
          {view === "heatmap" && <Dropdown value={tf} options={TF_OPTS} onChange={setTf} />}
          {coinOpts.length > 0 && <Dropdown value={coin} options={coinOpts} onChange={setCoin} />}
        </div>
      </div>

      {loading || empty ? (
        <div className="grid place-items-center py-20 text-slate-400">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="text-sm text-slate-500">Collecting whale positions from the live feed…</span>}
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px]">
            <span className="text-slate-400">Mark <span className="tabular font-semibold text-white">{priceFmt(mark)}</span></span>
            <span className="text-slate-400">Long liq <span className="tabular font-semibold text-ok">{compact(longTotal)}</span></span>
            <span className="text-slate-400">Short liq <span className="tabular font-semibold text-danger">{compact(shortTotal)}</span></span>
            <span className="text-slate-500">{levels.length} positions</span>
          </div>

          {view === "heatmap" && <Heatmap candles={candles} levels={levels} mark={mark} />}
          {view === "cascade" && <Cascade levels={levels} mark={mark} />}
          {view === "levels" && <Levels levels={levels} mark={mark} />}
        </>
      )}

      <p className="mt-3 text-[11px] text-slate-500">
        {view === "heatmap"
          ? "Live Hyperliquid candles with tracked-whale liquidation clusters overlaid (brighter = more $ liquidating at that price)."
          : view === "cascade"
            ? "Cumulative whale $ force-closed as price moves — steep steps are liquidation magnets."
            : "Every tracked-whale liquidation price, bucketed. Real Hyperliquid liquidationPx."}
      </p>
    </div>
  );
}

/* ── Heatmap: candles + liquidation bands ────────────────────────────────── */
function Heatmap({ candles, levels, mark }: { candles: Candle[]; levels: Level[]; mark: number }) {
  if (candles.length < 2) return <Msg text="Loading price history…" />;
  const W = 860, H = 380, L = 46, R = 60, T = 8, B = 24;
  const plotL = L, plotR = W - R, plotT = T, plotB = H - B, pw = plotR - plotL, ph = plotB - plotT;
  let pmin = Math.min(...candles.map((c) => c.l));
  let pmax = Math.max(...candles.map((c) => c.h));
  const pad = (pmax - pmin) * 0.08 || 1;
  pmin -= pad; pmax += pad;
  const y = (p: number) => plotT + (1 - (p - pmin) / (pmax - pmin)) * ph;
  const x = (i: number) => plotL + (i / (candles.length - 1)) * pw;

  const NB = 90, step = (pmax - pmin) / NB;
  const buckets = new Array(NB).fill(0);
  for (const l of levels) {
    if (l.price < pmin || l.price > pmax) continue;
    buckets[Math.min(NB - 1, Math.floor((l.price - pmin) / step))] += l.value;
  }
  const maxB = Math.max(...buckets, 1);
  const bw = Math.max(1, (pw / candles.length) * 0.6);
  const ticks = Array.from({ length: 6 }, (_, i) => pmin + ((pmax - pmin) * i) / 5);
  const timeIdx = [0, Math.floor(candles.length / 3), Math.floor((2 * candles.length) / 3), candles.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 380 }}>
      {/* purple base */}
      <rect x={plotL} y={plotT} width={pw} height={ph} fill={colormap(0)} />
      {/* liquidation bands (full width) */}
      {buckets.map((v, i) =>
        v > 0 ? <rect key={i} x={plotL} y={y(pmin + (i + 1) * step)} width={pw} height={Math.max(1, ph / NB + 0.5)} fill={colormap(Math.sqrt(v / maxB))} opacity={0.9} /> : null,
      )}
      {/* candles */}
      {candles.map((c, i) => {
        const up = c.c >= c.o;
        const col = up ? "#e5e7eb" : "#f87171";
        const yo = y(c.o), yc = y(c.c);
        return (
          <g key={i}>
            <line x1={x(i)} y1={y(c.h)} x2={x(i)} y2={y(c.l)} stroke={col} strokeWidth={0.6} opacity={0.85} />
            <rect x={x(i) - bw / 2} y={Math.min(yo, yc)} width={bw} height={Math.max(1, Math.abs(yc - yo))} fill={col} opacity={0.9} />
          </g>
        );
      })}
      {/* mark line */}
      {mark > 0 && mark >= pmin && mark <= pmax && (
        <g>
          <line x1={plotL} y1={y(mark)} x2={plotR} y2={y(mark)} stroke="#fff" strokeDasharray="3 3" strokeWidth={1} opacity={0.7} />
          <rect x={plotR - 2} y={y(mark) - 8} width={R} height={16} fill="#1f2937" />
          <text x={plotR + 4} y={y(mark) + 4} fill="#fff" fontSize={10} fontWeight={700}>{priceFmt(mark)}</text>
        </g>
      )}
      {/* price ticks */}
      {ticks.map((tv, i) => <text key={i} x={W - 4} y={y(tv) + 3} textAnchor="end" fill="#64748b" fontSize={9}>{priceFmt(tv)}</text>)}
      {/* time ticks */}
      {timeIdx.map((ti, i) => <text key={i} x={x(ti)} y={H - 8} textAnchor="middle" fill="#64748b" fontSize={9}>{tLabel(candles[ti].t)}</text>)}
      {/* colormap legend */}
      <defs>
        <linearGradient id="cmap" x1="0" y1="1" x2="0" y2="0">
          {STOPS.map((s, i) => <stop key={i} offset={`${(i / (STOPS.length - 1)) * 100}%`} stopColor={`rgb(${s[0]},${s[1]},${s[2]})`} />)}
        </linearGradient>
      </defs>
      <rect x={10} y={plotT} width={9} height={ph} fill="url(#cmap)" rx={2} />
      <text x={10} y={plotT - 1} fill="#94a3b8" fontSize={8}>{compact(maxB)}</text>
    </svg>
  );
}

/* ── Cascade: cumulative liquidation as price moves ──────────────────────── */
function Cascade({ levels, mark }: { levels: Level[]; mark: number }) {
  if (!mark || levels.length === 0) return <Msg text="No liquidation data." />;
  const longs = levels.filter((l) => l.long);
  const shorts = levels.filter((l) => !l.long);
  const minLong = longs.length ? Math.min(...longs.map((l) => l.price)) : mark;
  const maxShort = shorts.length ? Math.max(...shorts.map((l) => l.price)) : mark;
  const lo = Math.max(mark * 0.6, Math.min(mark * 0.97, minLong));
  const hi = Math.min(mark * 1.4, Math.max(mark * 1.03, maxShort));

  const W = 860, H = 340, L = 8, R = 60, T = 12, B = 26;
  const plotL = L, plotR = W - R, plotT = T, plotB = H - B, pw = plotR - plotL, ph = plotB - plotT;
  const N = 140;
  const below = Array.from({ length: N }, (_, i) => { const p = lo + ((mark - lo) * i) / (N - 1); return { p, v: longs.filter((l) => l.price >= p).reduce((s, l) => s + l.value, 0) }; });
  const above = Array.from({ length: N }, (_, i) => { const p = mark + ((hi - mark) * i) / (N - 1); return { p, v: shorts.filter((l) => l.price <= p).reduce((s, l) => s + l.value, 0) }; });
  const maxV = Math.max(...below.map((d) => d.v), ...above.map((d) => d.v), 1);
  const x = (p: number) => plotL + ((p - lo) / (hi - lo)) * pw;
  const y = (v: number) => plotB - (v / maxV) * ph;
  const areaOf = (pts: { p: number; v: number }[]) => `M${x(pts[0].p)},${plotB} ` + pts.map((d) => `L${x(d.p)},${y(d.v)}`).join(" ") + ` L${x(pts[pts.length - 1].p)},${plotB} Z`;
  const xmark = x(mark);
  const vTicks = Array.from({ length: 4 }, (_, i) => (maxV * (i + 1)) / 4);
  const pTicks = [lo, (lo + mark) / 2, mark, (mark + hi) / 2, hi];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 340 }}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity="0.4" /><stop offset="100%" stopColor="#34d399" stopOpacity="0.02" /></linearGradient>
        <linearGradient id="cr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" stopOpacity="0.4" /><stop offset="100%" stopColor="#f87171" stopOpacity="0.02" /></linearGradient>
      </defs>
      {vTicks.map((tv, i) => <g key={i}><line x1={plotL} y1={y(tv)} x2={plotR} y2={y(tv)} stroke="rgba(255,255,255,0.05)" /><text x={W - 4} y={y(tv) + 3} textAnchor="end" fill="#64748b" fontSize={9}>{compact(tv)}</text></g>)}
      <path d={areaOf(below)} fill="url(#cg)" stroke="#34d399" strokeWidth={1.5} />
      <path d={areaOf(above)} fill="url(#cr)" stroke="#f87171" strokeWidth={1.5} />
      <line x1={xmark} y1={plotT} x2={xmark} y2={plotB} stroke="#fff" strokeDasharray="3 3" strokeWidth={1} opacity={0.6} />
      <text x={xmark} y={plotT + 2} textAnchor="middle" fill="#fff" fontSize={9} fontWeight={700}>mark</text>
      {pTicks.map((p, i) => <text key={i} x={x(p)} y={H - 8} textAnchor="middle" fill="#64748b" fontSize={9}>{priceFmt(p)}</text>)}
      <text x={plotL + 4} y={plotB - 4} fill="#34d399" fontSize={9}>← longs liquidate</text>
      <text x={plotR - 4} y={plotB - 4} textAnchor="end" fill="#f87171" fontSize={9}>shorts liquidate →</text>
    </svg>
  );
}

/* ── Levels: polished horizontal bars ────────────────────────────────────── */
function Levels({ levels, mark }: { levels: Level[]; mark: number }) {
  const NB = 22;
  const prices = levels.map((l) => l.price);
  let lo = Math.min(...prices), hi = Math.max(...prices);
  if (mark) { lo = Math.min(lo, mark * 0.85); hi = Math.max(hi, mark * 1.15); }
  if (hi <= lo) hi = lo * 1.01 + 1;
  const step = (hi - lo) / NB;
  const buckets = Array.from({ length: NB }, (_, i) => ({ lo: lo + i * step, mid: lo + (i + 0.5) * step, long: 0, short: 0 }));
  for (const l of levels) {
    const idx = Math.min(NB - 1, Math.max(0, Math.floor((l.price - lo) / step)));
    if (l.long) buckets[idx].long += l.value; else buckets[idx].short += l.value;
  }
  const max = Math.max(...buckets.map((b) => b.long + b.short), 1);
  const markIdx = mark ? Math.min(NB - 1, Math.max(0, Math.floor((mark - lo) / step))) : -1;

  return (
    <div className="space-y-[3px]">
      {buckets.slice().reverse().map((b, ri) => {
        const i = NB - 1 - ri;
        const total = b.long + b.short;
        const w = Math.sqrt(total / max) * 100; // sqrt tames outliers
        const longDom = b.long >= b.short;
        const isMark = i === markIdx;
        const dist = mark ? ((b.mid - mark) / mark) * 100 : 0;
        return (
          <div key={i} className={`flex items-center gap-2 ${isMark ? "rounded bg-white/[0.04]" : ""}`}>
            <span className={`w-16 shrink-0 text-right tabular text-[11px] ${isMark ? "font-bold text-brand-300" : "text-slate-500"}`}>{priceFmt(b.mid)}</span>
            <span className="hidden w-10 shrink-0 text-right tabular text-[10px] text-slate-600 sm:inline">{mark ? `${dist >= 0 ? "+" : ""}${dist.toFixed(0)}%` : ""}</span>
            <div className="relative h-[15px] flex-1 rounded bg-white/[0.03]">
              <div className="flex h-full items-center rounded" style={{ width: `${Math.max(total > 0 ? 3 : 0, w)}%`, backgroundColor: longDom ? "#34d399" : "#f87171", opacity: total > 0 ? 0.85 : 0 }}>
                {total > 0 && w > 22 && <span className="ml-auto pr-1.5 text-[10px] font-semibold text-ink-950">{compact(total)}</span>}
              </div>
              {isMark && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">mark</span>}
            </div>
            {total > 0 && w <= 22 && <span className="w-16 shrink-0 text-right tabular text-[11px] text-slate-300">{compact(total)}</span>}
            {(total === 0 || w > 22) && <span className="w-16 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

function Msg({ text }: { text: string }) {
  return <div className="grid place-items-center py-20 text-sm text-slate-500" style={{ minHeight: 340 }}>{text}</div>;
}

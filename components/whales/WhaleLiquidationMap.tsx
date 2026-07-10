"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

// viridis-style colormap (magnitude -> colour), matching the heatmap look.
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
          ? "Live Hyperliquid candles with tracked-whale liquidation clusters overlaid (brighter = more $ liquidating). Right curve = cumulative liq if price reaches that level."
          : view === "cascade"
            ? "Cumulative whale $ force-closed as price moves — steep steps are liquidation magnets."
            : "Every tracked-whale liquidation price, bucketed. Real Hyperliquid liquidationPx."}
      </p>
    </div>
  );
}

/* Heatmap: candles + liquidation bands + zoom/pan + right cumulative curve */
function Heatmap({ candles, levels, mark }: { candles: Candle[]; levels: Level[]; mark: number }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [showCurve, setShowCurve] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  const W = 900, H = 380, T = 8, B = 24, RLAB = 52, CURVE = 92, GAP = 8;
  const plotL = 42;
  const plotR = W - RLAB - (showCurve ? CURVE : 0);
  const plotT = T, plotB = H - B, pw = plotR - plotL, ph = plotB - plotT;

  // wheel zoom (native + non-passive so we can stop the page from scrolling)
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(1, Math.min(12, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [candles.length]);

  if (candles.length < 2) return <Msg text="Loading price history…" />;

  // auto price window (candles + nearby whale liq clusters), then zoom/pan
  let amin = Math.min(...candles.map((c) => c.l));
  let amax = Math.max(...candles.map((c) => c.h));
  if (mark > 0) {
    const near = levels.filter((l) => l.price >= mark * 0.9 && l.price <= mark * 1.1).map((l) => l.price);
    if (near.length) { amin = Math.min(amin, ...near); amax = Math.max(amax, ...near); }
  }
  const apad = (amax - amin) * 0.06 || 1;
  amin -= apad; amax += apad;
  const autoMid = (amin + amax) / 2, autoHalf = Math.max(1, (amax - amin) / 2);
  const visHalf = autoHalf / zoom, visMid = autoMid + pan * autoHalf;
  const pmin = visMid - visHalf, pmax = visMid + visHalf;

  const y = (p: number) => plotT + (1 - (p - pmin) / (pmax - pmin)) * ph;
  const x = (i: number) => plotL + (i / (candles.length - 1)) * pw;

  const NB = 100, step = (pmax - pmin) / NB;
  const buckets = new Array(NB).fill(0);
  for (const l of levels) {
    if (l.price < pmin || l.price > pmax) continue;
    buckets[Math.min(NB - 1, Math.floor((l.price - pmin) / step))] += l.value;
  }
  const maxB = Math.max(...buckets, 1);
  const bw = Math.max(1, (pw / candles.length) * 0.6);
  const ticks = Array.from({ length: 6 }, (_, i) => pmin + ((pmax - pmin) * i) / 5);
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const spanH = (candles[candles.length - 1].t - candles[0].t) / 3600e3;
  const multiDay = spanH > 26;
  const tickLabel = (t: number) => {
    const d = new Date(t);
    const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return multiDay ? `${d.getMonth() + 1}/${d.getDate()} ${hm}` : hm;
  };
  const timeIdx = [0, 0.2, 0.4, 0.6, 0.8, 1].map((f) => Math.round(f * (candles.length - 1)));

  // right-side cumulative liquidation curve
  const curveL = plotR + GAP, curveW = CURVE - GAP - 4;
  const NC = 120;
  const cLong = (p: number) => levels.filter((l) => l.long && l.price >= p).reduce((s, l) => s + l.value, 0);
  const cShort = (p: number) => levels.filter((l) => !l.long && l.price <= p).reduce((s, l) => s + l.value, 0);
  const curvePts = Array.from({ length: NC }, (_, i) => {
    const p = pmin + ((pmax - pmin) * i) / (NC - 1);
    return { p, v: mark && p <= mark ? cLong(p) : cShort(p) };
  });
  const maxC = Math.max(...curvePts.map((d) => d.v), 1);
  const cx = (v: number) => curveL + (v / maxC) * curveW;
  const green = curvePts.filter((d) => d.p <= mark);
  const red = curvePts.filter((d) => d.p > mark);
  const areaPath = (pts: { p: number; v: number }[]) =>
    pts.length ? `M${curveL},${y(pts[0].p)} ` + pts.map((d) => `L${cx(d.v)},${y(d.p)}`).join(" ") + ` L${curveL},${y(pts[pts.length - 1].p)} Z` : "";

  const onMove = (e: React.MouseEvent) => {
    const el = svgRef.current;
    if (!el) return;
    if (dragging.current) {
      const dyVB = (e.movementY / el.clientHeight) * H;
      setPan((pn) => clamp(pn + (dyVB / ph) * (2 / zoom), -3, 3));
      if (hover) setHover(null);
      return;
    }
    const box = el.getBoundingClientRect();
    const vx = ((e.clientX - box.left) / box.width) * W;
    const vy = ((e.clientY - box.top) / box.height) * H;
    setHover(vx >= plotL && vx <= plotR && vy >= plotT && vy <= plotB ? { x: vx, y: vy } : null);
  };
  const hoverPrice = hover ? pmin + (1 - (hover.y - plotT) / ph) * (pmax - pmin) : 0;
  const hoverIdx = hover ? clamp(Math.round(((hover.x - plotL) / pw) * (candles.length - 1)), 0, candles.length - 1) : 0;
  const hoverBucket = hover ? buckets[clamp(Math.floor((hoverPrice - pmin) / step), 0, NB - 1)] : 0;
  const hoverCum = hover ? (hoverPrice <= mark ? cLong(hoverPrice) : cShort(hoverPrice)) : 0;

  return (
    <div className="relative">
      <div className="absolute right-1 top-1 z-10 flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-1 text-[11px] text-slate-400">
          <input type="checkbox" checked={showCurve} onChange={(e) => setShowCurve(e.target.checked)} className="accent-brand-400" /> Liq curve
        </label>
        <button onClick={() => { setZoom(1); setPan(0); }} className="rounded border border-white/10 px-2 py-0.5 text-[11px] text-slate-400 hover:text-white">Reset</button>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-grab select-none active:cursor-grabbing"
        style={{ height: 380 }}
        onMouseDown={() => { dragging.current = true; }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; setHover(null); }}
        onMouseMove={onMove}
      >
        <defs>
          <clipPath id="lqclip"><rect x={plotL} y={plotT} width={pw} height={ph} /></clipPath>
          <linearGradient id="cmap" x1="0" y1="1" x2="0" y2="0">
            {STOPS.map((s, i) => <stop key={i} offset={`${(i / (STOPS.length - 1)) * 100}%`} stopColor={`rgb(${s[0]},${s[1]},${s[2]})`} />)}
          </linearGradient>
        </defs>

        <rect x={plotL} y={plotT} width={pw} height={ph} fill={colormap(0)} />
        <g clipPath="url(#lqclip)">
          {buckets.map((v, i) => (v > 0 ? <rect key={i} x={plotL} y={y(pmin + (i + 1) * step)} width={pw} height={Math.max(1, ph / NB + 0.6)} fill={colormap(Math.sqrt(v / maxB))} opacity={0.92} /> : null))}
          {candles.map((c, i) => {
            const up = c.c >= c.o, col = up ? "#e5e7eb" : "#f87171", yo = y(c.o), yc = y(c.c);
            return (
              <g key={i}>
                <line x1={x(i)} y1={y(c.h)} x2={x(i)} y2={y(c.l)} stroke={col} strokeWidth={0.6} opacity={0.85} />
                <rect x={x(i) - bw / 2} y={Math.min(yo, yc)} width={bw} height={Math.max(1, Math.abs(yc - yo))} fill={col} opacity={0.9} />
              </g>
            );
          })}
          {mark > 0 && mark >= pmin && mark <= pmax && <line x1={plotL} y1={y(mark)} x2={plotR} y2={y(mark)} stroke="#fff" strokeDasharray="3 3" strokeWidth={1} opacity={0.7} />}
        </g>

        {showCurve && (
          <g>
            <line x1={curveL} y1={plotT} x2={curveL} y2={plotB} stroke="rgba(255,255,255,0.12)" />
            <path d={areaPath(green)} fill="rgba(52,211,153,0.22)" stroke="#34d399" strokeWidth={1.2} />
            <path d={areaPath(red)} fill="rgba(248,113,113,0.22)" stroke="#f87171" strokeWidth={1.2} />
            <text x={curveL} y={plotT - 1} fill="#64748b" fontSize={8}>cum. liq</text>
          </g>
        )}

        {mark > 0 && mark >= pmin && mark <= pmax && (
          <g>
            <rect x={W - RLAB} y={y(mark) - 8} width={RLAB} height={16} fill="#1f2937" />
            <text x={W - 4} y={y(mark) + 4} textAnchor="end" fill="#fff" fontSize={10} fontWeight={700}>{priceFmt(mark)}</text>
          </g>
        )}
        {ticks.map((tv, i) => <text key={i} x={W - 4} y={y(tv) + 3} textAnchor="end" fill="#64748b" fontSize={9}>{priceFmt(tv)}</text>)}
        {timeIdx.map((ti, i) => <text key={i} x={x(ti)} y={H - 8} textAnchor="middle" fill="#64748b" fontSize={9}>{tickLabel(candles[ti].t)}</text>)}

        {hover && (
          <g pointerEvents="none">
            <line x1={plotL} y1={hover.y} x2={plotR} y2={hover.y} stroke="rgba(255,255,255,0.28)" strokeWidth={0.6} />
            <line x1={hover.x} y1={plotT} x2={hover.x} y2={plotB} stroke="rgba(255,255,255,0.28)" strokeWidth={0.6} />
            {(() => {
              const tw = 172, th = 64;
              const tx = clamp(hover.x + 12, plotL, plotR - tw);
              const ty = clamp(hover.y - th - 6, plotT, plotB - th);
              return (
                <g>
                  <rect x={tx} y={ty} width={tw} height={th} rx={5} fill="#0b1220" stroke="rgba(255,255,255,0.14)" />
                  <text x={tx + 9} y={ty + 15} fill="#cbd5e1" fontSize={9}>{new Date(candles[hoverIdx].t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</text>
                  <text x={tx + 9} y={ty + 30} fill="#94a3b8" fontSize={9}>Price <tspan fill="#fff" fontWeight="700">{priceFmt(hoverPrice)}</tspan></text>
                  <text x={tx + 9} y={ty + 44} fill="#94a3b8" fontSize={9}>Whale liq here <tspan fill="#facc15">{hoverBucket > 0 ? compact(hoverBucket) : "—"}</tspan></text>
                  <text x={tx + 9} y={ty + 58} fill="#94a3b8" fontSize={9}>Cum. to price <tspan fill={hoverPrice <= mark ? "#34d399" : "#f87171"}>{compact(hoverCum)}</tspan></text>
                </g>
              );
            })()}
          </g>
        )}

        <rect x={10} y={plotT} width={9} height={ph} fill="url(#cmap)" rx={2} />
        <text x={10} y={plotT - 1} fill="#94a3b8" fontSize={8}>{compact(maxB)}</text>
      </svg>
      <div className="mt-1 text-center text-[10px] text-slate-600">scroll to zoom · drag to pan · hover for details · {zoom.toFixed(1)}×</div>
    </div>
  );
}

/* Cascade: cumulative liquidation as price moves */
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

/* Levels: polished horizontal bars */
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
        const w = Math.sqrt(total / max) * 100;
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Flame } from "lucide-react";
import { trackedAddresses, fetchWhaleStates, type WhaleState } from "@/lib/hlPos";
import { compact } from "@/lib/whale";
import { Dropdown } from "./ui";

const BUCKETS = 22;
const priceFmt = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: n >= 100 ? 0 : 4 });

export default function WhaleLiquidationMap() {
  const [states, setStates] = useState<WhaleState[]>([]);
  const [mids, setMids] = useState<Record<string, string>>({});
  const [coin, setCoin] = useState<string>("");
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

  // Rank coins by total liquidation notional so the selector defaults sensibly.
  const coinOpts = useMemo(() => {
    const byCoin: Record<string, number> = {};
    for (const s of states)
      for (const p of s.positions)
        if (p.liqPx) byCoin[p.coin] = (byCoin[p.coin] || 0) + p.value;
    return Object.entries(byCoin).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c]) => ({ label: c, value: c }));
  }, [states]);

  useEffect(() => {
    if (!coin && coinOpts.length) setCoin(coinOpts[0].value);
  }, [coin, coinOpts]);

  const view = useMemo(() => {
    if (!coin) return null;
    const positions = states.flatMap((s) => s.positions).filter((p) => p.coin === coin && p.liqPx && p.liqPx > 0);
    if (positions.length === 0) return { positions: [], buckets: [], mark: 0, longTotal: 0, shortTotal: 0, max: 0, markIdx: -1 };
    const mark = Number(mids[coin]) || 0;
    const liqs = positions.map((p) => p.liqPx as number);
    let lo = Math.min(...liqs);
    let hi = Math.max(...liqs);
    if (mark) { lo = Math.min(lo, mark * 0.85); hi = Math.max(hi, mark * 1.15); }
    if (hi <= lo) hi = lo * 1.01 + 1;
    const step = (hi - lo) / BUCKETS;
    const buckets = Array.from({ length: BUCKETS }, (_, i) => ({ lo: lo + i * step, hi: lo + (i + 1) * step, mid: lo + (i + 0.5) * step, long: 0, short: 0 }));
    for (const p of positions) {
      const idx = Math.min(BUCKETS - 1, Math.max(0, Math.floor(((p.liqPx as number) - lo) / step)));
      if (p.szi > 0) buckets[idx].long += p.value; else buckets[idx].short += p.value;
    }
    const max = Math.max(...buckets.map((b) => b.long + b.short), 1);
    const markIdx = mark ? Math.min(BUCKETS - 1, Math.max(0, Math.floor((mark - lo) / step))) : -1;
    return {
      positions,
      buckets,
      mark,
      longTotal: positions.filter((p) => p.szi > 0).reduce((s, p) => s + p.value, 0),
      shortTotal: positions.filter((p) => p.szi < 0).reduce((s, p) => s + p.value, 0),
      max,
      markIdx,
    };
  }, [coin, states, mids]);

  return (
    <div className="glass p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Flame className="h-4 w-4 text-warn" /> Whale Liquidation Map</h3>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-3 text-[11px] text-slate-400 sm:flex">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-ok" /> Long liq (below)</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-danger" /> Short liq (above)</span>
          </span>
          {coinOpts.length > 0 && <Dropdown value={coin} options={coinOpts} onChange={setCoin} />}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : !view || view.positions.length === 0 ? (
        <div className="py-14 text-center text-sm text-slate-500">
          {coinOpts.length === 0 ? "Collecting whale positions from the live feed…" : `No tracked-whale liquidation levels in ${coin} right now.`}
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px]">
            <span className="text-slate-400">Mark <span className="tabular font-semibold text-white">{priceFmt(view.mark)}</span></span>
            <span className="text-slate-400">Long liq exposure <span className="tabular font-semibold text-ok">{compact(view.longTotal)}</span></span>
            <span className="text-slate-400">Short liq exposure <span className="tabular font-semibold text-danger">{compact(view.shortTotal)}</span></span>
            <span className="text-slate-500">{view.positions.length} positions</span>
          </div>

          <div className="space-y-[3px]">
            {view.buckets.slice().reverse().map((b, ri) => {
              const i = BUCKETS - 1 - ri;
              const total = b.long + b.short;
              const w = (total / view.max) * 100;
              const longDom = b.long >= b.short;
              const opacity = total > 0 ? 0.3 + 0.7 * (total / view.max) : 0;
              const isMark = i === view.markIdx;
              return (
                <div key={i} className={`flex items-center gap-2 ${isMark ? "rounded bg-white/[0.04]" : ""}`}>
                  <span className={`w-16 shrink-0 text-right tabular text-[11px] ${isMark ? "font-bold text-brand-300" : "text-slate-500"}`}>{priceFmt(b.mid)}</span>
                  <div className="relative h-[15px] flex-1 overflow-hidden rounded bg-white/[0.03]">
                    <div className="h-full rounded" style={{ width: `${w}%`, backgroundColor: longDom ? "#34d399" : "#f87171", opacity }} />
                    {isMark && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">mark</span>}
                  </div>
                  <span className="w-20 shrink-0 text-right tabular text-[11px] text-slate-300">{total > 0 ? compact(total) : ""}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-4 text-[11px] text-slate-500">
        Liquidation price of every tracked-whale {coin || "perp"} position, bucketed by price — real Hyperliquid <code className="text-slate-400">liquidationPx</code>. Clusters mark where big whale positions get force-closed.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Waves } from "lucide-react";
import { trackedAddresses, fetchWhaleStates, type WhaleState } from "@/lib/hlPos";
import { compact, signed } from "@/lib/whale";

export default function WhaleAggregate() {
  const [states, setStates] = useState<WhaleState[]>([]);
  const [tracked, setTracked] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function run(force: boolean) {
      const addrs = trackedAddresses(100);
      setTracked(addrs.length);
      if (!addrs.length) {
        setLoading(false);
        return;
      }
      const st = await fetchWhaleStates(addrs, force);
      if (alive) {
        setStates(st.filter((s) => s.positions.length > 0));
        setLoading(false);
      }
    }
    run(false);
    const reread = setInterval(() => run(false), 20_000);
    const refetch = setInterval(() => run(true), 60_000);
    return () => {
      alive = false;
      clearInterval(reread);
      clearInterval(refetch);
    };
  }, []);

  const agg = useMemo(() => {
    const a = { longPos: 0, shortPos: 0, longMargin: 0, shortMargin: 0, longPnl: 0, shortPnl: 0, longFund: 0, shortFund: 0 };
    for (const s of states)
      for (const p of s.positions) {
        if (p.szi > 0) { a.longPos += p.value; a.longMargin += p.marginUsed; a.longPnl += p.uPnl; a.longFund += p.funding; }
        else { a.shortPos += p.value; a.shortMargin += p.marginUsed; a.shortPnl += p.uPnl; a.shortFund += p.funding; }
      }
    return a;
  }, [states]);

  return (
    <div className="glass p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Waves className="h-4 w-4 text-brand-400" /> Tracked-Whale Aggregate</h3>
        <span className="text-[11px] text-slate-500">{states.length} wallets · live</span>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : states.length === 0 ? (
        <div className="py-14 text-center text-sm text-slate-500">Collecting whale wallets from the live feed — keep this page open for a few seconds…</div>
      ) : (
        <div className="space-y-3">
          <SplitStat label="Position" total={agg.longPos + agg.shortPos} long={agg.longPos} short={agg.shortPos} longLabel="Long Position" shortLabel="Short Position" />
          <SplitStat label="Margin" total={agg.longMargin + agg.shortMargin} long={agg.longMargin} short={agg.shortMargin} longLabel="Long Margin" shortLabel="Short Margin" />
          <SplitStat label="Unrealized PnL" total={agg.longPnl + agg.shortPnl} long={agg.longPnl} short={agg.shortPnl} longLabel="Long PnL" shortLabel="Short PnL" signedVals />
          <SplitStat label="Funding Paid" total={agg.longFund + agg.shortFund} long={agg.longFund} short={agg.shortFund} longLabel="Long Funding" shortLabel="Short Funding" signedVals />
        </div>
      )}

      <p className="mt-4 text-[11px] text-slate-500">
        Aggregated across the {tracked} whale wallets we&apos;ve seen streaming (largest first) — real Hyperliquid state, not the whole chain.
      </p>
    </div>
  );
}

function SplitStat({
  label, total, long, short, longLabel, shortLabel, signedVals = false,
}: {
  label: string; total: number; long: number; short: number; longLabel: string; shortLabel: string; signedVals?: boolean;
}) {
  const denom = Math.abs(long) + Math.abs(short) || 1;
  const longPct = (Math.abs(long) / denom) * 100;
  const fmt = (v: number) => (signedVals ? signed(v) : compact(v));
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] text-slate-400">{label}</span>
        <span className={`tabular text-lg font-bold ${signedVals ? (total >= 0 ? "text-ok" : "text-danger") : "text-white"}`}>{fmt(total)}</span>
      </div>
      <div className="mt-2 flex justify-between text-[11px]">
        <span className="text-slate-400">{longLabel} <span className={`tabular font-semibold ${signedVals ? (long >= 0 ? "text-ok" : "text-danger") : "text-ok"}`}>{fmt(long)}</span> <span className="text-slate-600">({longPct.toFixed(1)}%)</span></span>
        <span className="text-slate-400"><span className="text-slate-600">({(100 - longPct).toFixed(1)}%)</span> <span className={`tabular font-semibold ${signedVals ? (short >= 0 ? "text-ok" : "text-danger") : "text-danger"}`}>{fmt(short)}</span> {shortLabel}</span>
      </div>
      <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full bg-ok" style={{ width: `${longPct}%` }} />
        <div className="h-full bg-danger" style={{ width: `${100 - longPct}%` }} />
      </div>
    </div>
  );
}

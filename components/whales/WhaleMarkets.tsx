"use client";

import { useEffect, useState } from "react";

type Row = {
  coin: string;
  mark: number;
  funding: number;
  oiUsd: number;
  volUsd: number;
  chg: number;
};

const compact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(a / 1e3).toFixed(1)}K`;
  return `$${a.toFixed(2)}`;
};

export default function WhaleMarkets() {
  const [rows, setRows] = useState<Row[]>([]);
  const [ts, setTs] = useState<string>("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/hl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "metaAndAssetCtxs" }),
        });
        const d = await r.json();
        if (!alive || !Array.isArray(d) || d.length < 2) return;
        const universe: { name: string }[] = d[0].universe;
        const ctxs: Record<string, string>[] = d[1];
        const out: Row[] = universe.map((u, i) => {
          const c = ctxs[i] || {};
          const mark = Number(c.markPx || c.midPx || 0);
          const prev = Number(c.prevDayPx || mark);
          return {
            coin: u.name,
            mark,
            funding: Number(c.funding || 0) * 100,
            oiUsd: Number(c.openInterest || 0) * mark,
            volUsd: Number(c.dayNtlVlm || 0),
            chg: prev ? ((mark - prev) / prev) * 100 : 0,
          };
        });
        out.sort((a, b) => b.volUsd - a.volUsd);
        setRows(out.slice(0, 10));
        setTs(new Date().toLocaleTimeString());
      } catch {
        /* leave last good data */
      }
    }
    load();
    const id = setInterval(() => !document.hidden && load(), 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="glass p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Hyperliquid markets</h3>
        {ts && <span className="text-[11px] text-slate-500">updated {ts}</span>}
      </div>
      {rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">Loading live markets…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Coin", "Price", "24h", "Open interest", "24h volume", "Funding"].map((h) => (
                  <th key={h} className="whitespace-nowrap py-2 pr-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular">
              {rows.map((r) => (
                <tr key={r.coin} className="border-t border-white/[0.05]">
                  <td className="py-2 pr-3 font-semibold text-white">{r.coin}</td>
                  <td className="py-2 pr-3 text-slate-200">
                    ${r.mark.toLocaleString("en-US", { maximumFractionDigits: r.mark < 10 ? 4 : 2 })}
                  </td>
                  <td className={`py-2 pr-3 ${r.chg >= 0 ? "text-ok" : "text-danger"}`}>
                    {r.chg >= 0 ? "+" : ""}{r.chg.toFixed(2)}%
                  </td>
                  <td className="py-2 pr-3 text-slate-300">{compact(r.oiUsd)}</td>
                  <td className="py-2 pr-3 text-slate-300">{compact(r.volUsd)}</td>
                  <td className={`py-2 pr-3 ${r.funding >= 0 ? "text-slate-400" : "text-danger"}`}>
                    {r.funding >= 0 ? "+" : ""}{r.funding.toFixed(4)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

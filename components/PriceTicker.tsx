"use client";

import { useEffect, useState } from "react";

type Row = { coin: string; price: number; chg: number };

// Order/allowlist for the ticker (majors + active perps).
const COINS = ["BTC", "ETH", "SOL", "HYPE", "XRP", "DOGE", "SUI", "AVAX", "LINK", "BNB", "LTC", "AAVE"];
const fmtP = (v: number) => "$" + v.toLocaleString("en-US", { maximumFractionDigits: v >= 100 ? 0 : v >= 1 ? 2 : 5 });

export default function PriceTicker() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const r = await fetch("/api/hl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "metaAndAssetCtxs" }) });
        const d = await r.json();
        const uni = d?.[0]?.universe || [];
        const ctx = d?.[1] || [];
        const out: Row[] = [];
        for (let i = 0; i < uni.length; i++) {
          const name = uni[i]?.name;
          if (!COINS.includes(name)) continue;
          const mk = Number(ctx[i]?.markPx) || 0;
          const pd = Number(ctx[i]?.prevDayPx) || 0;
          if (mk) out.push({ coin: name, price: mk, chg: pd ? (mk / pd - 1) * 100 : 0 });
        }
        out.sort((a, b) => COINS.indexOf(a.coin) - COINS.indexOf(b.coin));
        if (alive && out.length) setRows(out);
      } catch {
        /* ignore */
      }
    };
    run();
    const t = setInterval(run, 10_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!rows.length) return null;
  const items = [...rows, ...rows]; // duplicate for a seamless loop

  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-white/[0.015] py-2.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--bg)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--bg)] to-transparent" />
      <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap px-4">
        {items.map((r, i) => (
          <span key={i} className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold text-slate-200">{r.coin}</span>
            <span className="tabular text-slate-300">{fmtP(r.price)}</span>
            <span className={`tabular text-[12px] font-medium ${r.chg >= 0 ? "text-ok" : "text-danger"}`}>
              {r.chg >= 0 ? "▲" : "▼"} {Math.abs(r.chg).toFixed(2)}%
            </span>
            <span className="text-white/10">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

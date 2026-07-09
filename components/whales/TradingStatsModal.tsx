"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Copy } from "lucide-react";
import {
  type Trade,
  type Window,
  filterWindow,
  computeStats,
  perAsset,
  perSide,
  money,
  signed,
  pct,
  fmtDuration,
} from "@/lib/whale";
import { Donut, Dropdown } from "./ui";

const WIN_OPTS: { label: string; value: Window }[] = [
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "All", value: "All" },
];

export default function TradingStatsModal({
  address,
  trades,
  onClose,
}: {
  address: string;
  trades: Trade[];
  onClose: () => void;
}) {
  const [win, setWin] = useState<Window>("1W");
  const [tab, setTab] = useState<"asset" | "position">("asset");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const scoped = useMemo(() => filterWindow(trades, win), [trades, win]);
  const s = useMemo(() => computeStats(scoped), [scoped]);
  const assets = useMemo(() => perAsset(scoped), [scoped]);
  const sides = useMemo(() => perSide(scoped), [scoped]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div
        className="glass my-4 w-full max-w-4xl p-5 shadow-card sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Trading Statistics</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-mono text-sm text-slate-300">
            {address.slice(0, 6)}…{address.slice(-4)}
            <button onClick={() => navigator.clipboard?.writeText(address)} className="text-slate-500 hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
          </span>
          <Dropdown value={win} options={WIN_OPTS} onChange={setWin} />
        </div>

        {scoped.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            No closed positions in this window (from Hyperliquid recent fills).
          </div>
        ) : (
          <>
            {/* top cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-[11px] text-slate-400">Win Rate</div>
                <div className="tabular mt-0.5 text-2xl font-bold text-white">{pct(s.winRate)}</div>
                <div className="mt-3 space-y-1 text-[11px]">
                  <Row k="Closing PnL (before fees)" v={signed(s.closingPnl)} tone={s.closingPnl >= 0 ? "ok" : "danger"} />
                  <Row k="Fees deducted" v={signed(s.fees)} tone="danger" />
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-[11px] text-slate-400">Closed Positions</div>
                <div className="mt-1 flex items-center justify-between">
                  <div>
                    <div className="tabular text-2xl font-bold text-white">{s.count}</div>
                    <div className="mt-2 space-y-1 text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-400"><i className="h-2 w-2 rounded-full bg-ok" /> Profit <b className="ml-auto text-white">{s.wins}</b></span>
                      <span className="flex items-center gap-1.5 text-slate-400"><i className="h-2 w-2 rounded-full bg-danger" /> Loss <b className="ml-auto text-white">{s.losses}</b></span>
                    </div>
                  </div>
                  <Donut value={s.winRate} color="#34d399" track="rgba(248,113,113,0.35)" size={58} thickness={8} />
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-[11px] text-slate-400">Net PnL</div>
                <div className={`tabular mt-0.5 text-2xl font-bold ${s.net >= 0 ? "text-ok" : "text-danger"}`}>{signed(s.net)}</div>
                <div className="mt-3 space-y-1 text-[11px]">
                  <Row k="Long" v={signed(s.longNet)} tone={s.longNet >= 0 ? "ok" : "danger"} />
                  <Row k="Short" v={signed(s.shortNet)} tone={s.shortNet >= 0 ? "ok" : "danger"} />
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-[11px] text-slate-400">Total Holding Time</div>
                <div className="tabular mt-0.5 text-2xl font-bold text-white">{fmtDuration(s.totalHold)}</div>
                <div className="mt-3 space-y-1 text-[11px]">
                  <Row k="Holding Range" v={`${fmtDuration(s.minHold)} ~ ${fmtDuration(s.maxHold)}`} />
                  <Row k="Average Holding Time" v={fmtDuration(s.avgHold)} />
                </div>
              </div>
            </div>

            {/* top trades */}
            <div className="mt-6 mb-3 text-sm font-bold text-white">Top 10 Best Trades</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {s.top.map((t, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="font-semibold text-white">{t.coin}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.side === "Long" ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"}`}>{t.side}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{fmtDuration(Date.now() - t.closeTime)} ago</span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-500">PnL</div>
                  <div className={`tabular text-lg font-bold ${t.net >= 0 ? "text-ok" : "text-danger"}`}>{signed(t.net)}</div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Duration</span>
                    <span className="text-slate-300">{fmtDuration(t.durationMs)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* performance breakdown */}
            <div className="mt-6 flex items-center gap-5 border-b border-white/[0.06]">
              {(["asset", "position"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition-colors ${tab === t ? "border-brand-400 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
                >
                  {t === "asset" ? "Performance by asset" : "Performance by position"}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tab === "asset"
                ? assets.map((a) => (
                    <div key={a.coin} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{a.coin}</span>
                        <span className="text-[11px] text-slate-500">{a.count} Trades</span>
                      </div>
                      <div className="mt-1.5 text-[11px] text-slate-500">Net PnL</div>
                      <div className={`tabular text-lg font-bold ${a.net >= 0 ? "text-ok" : "text-danger"}`}>{signed(a.net)}</div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Gross</span><span className="text-slate-300">{signed(a.realized)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Fees</span><span className="text-slate-300">{money(a.fees)}</span>
                      </div>
                    </div>
                  ))
                : sides.map((sd) => (
                    <div key={sd.side} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                      <div className="flex items-center justify-between">
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${sd.side === "Long" ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"}`}>{sd.side}</span>
                        <span className="text-[11px] text-slate-500">{sd.count} Trades</span>
                      </div>
                      <div className="mt-1.5 text-[11px] text-slate-500">Net PnL</div>
                      <div className={`tabular text-lg font-bold ${sd.net >= 0 ? "text-ok" : "text-danger"}`}>{signed(sd.net)}</div>
                    </div>
                  ))}
            </div>

            <p className="mt-5 text-[11px] text-slate-500">
              Computed from Hyperliquid&apos;s recent fills (up to the last ~2,000). Longer windows
              may be partial. Read-only, informational — not trading advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "ok" | "danger" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{k}</span>
      <span className={tone === "ok" ? "text-ok" : tone === "danger" ? "text-danger" : "text-slate-300"}>{v}</span>
    </div>
  );
}

import { Pause, Activity, Bell, ScrollText, Layers } from "lucide-react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const lanes = [
  {
    name: "RSI Reversion",
    market: "BTC-USDT · 1h",
    state: "Live",
    tone: "ok",
    capital: "$2,500",
    risk: "Balanced",
    pnl: "+1.8%",
    pnlTone: "text-ok",
  },
  {
    name: "Trend Breakout",
    market: "ETH-USDT · 4h",
    state: "Paper",
    tone: "brand",
    capital: "$1,000",
    risk: "Conservative",
    pnl: "+0.4%",
    pnlTone: "text-ok",
  },
  {
    name: "Range Scalper",
    market: "SOL-USDT · 15m",
    state: "Paused",
    tone: "warn",
    capital: "$1,500",
    risk: "Aggressive",
    pnl: "daily limit",
    pnlTone: "text-warn",
  },
];

const toneMap: Record<string, string> = {
  ok: "border-ok/30 bg-ok/[0.08] text-ok",
  brand: "border-brand-400/30 bg-brand-500/[0.08] text-brand-400",
  warn: "border-warn/30 bg-warn/[0.08] text-warn",
};

const monitor = [
  { icon: Activity, label: "Live status & open positions" },
  { icon: Bell, label: "Alerts on fills, errors & limits" },
  { icon: ScrollText, label: "Full execution & audit log" },
  { icon: Pause, label: "Pause one agent — or pause all" },
];

export default function Automation() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Automation & control"
          title={
            <>
              Run multiple strategies.{" "}
              <span className="gradient-text">
                Keep every agent inside its own mandate.
              </span>
            </>
          }
          sub="Distinct rule sets across markets, each with separated capital and risk limits — and always observable, explainable and interruptible."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {lanes.map((l, i) => (
            <Reveal key={l.name} delay={i * 0.08}>
              <div className="glass glass-hover h-full p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-white">{l.name}</span>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneMap[l.tone]}`}
                  >
                    {l.state}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-400">{l.market}</div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Capital", l.capital, "text-white"],
                    ["Risk", l.risk, "text-slate-300"],
                    ["Daily", l.pnl, l.pnlTone],
                  ].map(([k, v, tone]) => (
                    <div
                      key={k}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2"
                    >
                      <div className="text-[10px] text-slate-500">{k}</div>
                      <div className={`tabular text-[12px] font-semibold ${tone}`}>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>

                <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] py-2 text-xs font-medium text-slate-300 transition-colors hover:border-white/20">
                  <Pause className="h-3.5 w-3.5" />
                  {l.state === "Paused" ? "Resume agent" : "Pause agent"}
                </button>
              </div>
            </Reveal>
          ))}
        </div>

        {/* monitoring strip */}
        <Reveal delay={0.1}>
          <div className="mt-6 grid gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 sm:grid-cols-2 lg:grid-cols-4">
            {monitor.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-brand-400">
                  <m.icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-slate-300">{m.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

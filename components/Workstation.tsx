import {
  GitBranch,
  Gauge,
  LineChart,
  ShieldCheck,
  Check,
  AlertTriangle,
  Power,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { site } from "@/lib/site";

export default function Workstation() {
  return (
    <section id="workstation" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="The workstation"
          title={
            <>
              Build the exact rules you trade —{" "}
              <span className="gradient-text">not a generic preset.</span>
            </>
          }
          sub="A real trading workstation: express strategies, test them honestly, and constrain execution with risk rules you approve."
        />

        <div className="mt-16 space-y-6">
          <FeatureRow
            reverse={false}
            icon={GitBranch}
            kicker="Strategy Editor"
            title="Every indicator, condition and timeframe — editable"
            points={[
              "Visual AND / OR condition groups with multi-timeframe filters",
              "RSI · EMA · MACD · Bollinger · volume and more",
              "Entries, exits, stops, targets, trailing, cooldowns & sessions",
              "Saved versions — duplicate and compare v1 vs v2",
            ]}
            cta={{ label: "Open Strategy Builder", href: site.appUrl }}
            visual={<EditorMock />}
          />

          <FeatureRow
            reverse
            icon={LineChart}
            kicker="Backtesting & Validation"
            title="Test the rules before the rules touch your capital"
            points={[
              "Transparent assumptions: fees, funding, slippage & execution",
              "Net return, max drawdown, profit factor, win rate & more",
              "Equity + drawdown curves and a full trade list",
              "Walk-forward & out-of-sample checks for robustness",
            ]}
            cta={{ label: "Backtest a Strategy", href: site.appUrl }}
            visual={<BacktestMock />}
          />

          <FeatureRow
            reverse={false}
            icon={ShieldCheck}
            kicker="Advanced Risk Engine"
            title="Risk rules decide how much the agent is allowed to do"
            points={[
              "Per-trade risk, position sizing, stop / target & trailing",
              "Leverage cap, max daily loss & portfolio drawdown limits",
              "Consecutive-loss pause, cooldowns and time windows",
              "A manual kill switch that's always one tap away",
            ]}
            cta={{ label: "Configure Risk Rules", href: site.appUrl }}
            visual={<RiskMock />}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureRow({
  reverse,
  icon: Icon,
  kicker,
  title,
  points,
  cta,
  visual,
}: {
  reverse: boolean;
  icon: React.ComponentType<{ className?: string }>;
  kicker: string;
  title: string;
  points: string[];
  cta: { label: string; href: string };
  visual: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <Reveal className={reverse ? "lg:order-2" : ""}>
        <div>
          <span className="eyebrow">
            <Icon className="h-4 w-4" /> {kicker}
          </span>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl text-balance">
            {title}
          </h3>
          <ul className="mt-6 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/15 text-brand-400">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-sm text-slate-300">{p}</span>
              </li>
            ))}
          </ul>
          <a href={cta.href} className="btn-ghost mt-7">
            {cta.label}
          </a>
        </div>
      </Reveal>

      <Reveal delay={0.08} className={reverse ? "lg:order-1" : ""}>
        <div className="glass p-4 shadow-card sm:p-5">{visual}</div>
      </Reveal>
    </div>
  );
}

/* ── Mock UIs ─────────────────────────────────────────────────────────── */

function MockHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span className="flex gap-1.5">
          <i className="h-2 w-2 rounded-full bg-danger/70" />
          <i className="h-2 w-2 rounded-full bg-warn/70" />
          <i className="h-2 w-2 rounded-full bg-ok/70" />
        </span>
        {title}
      </div>
      <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
        Illustrative sample
      </span>
    </div>
  );
}

function EditorMock() {
  return (
    <div>
      <MockHeader title="strategy · rsi-reversion.v2" />
      <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-2">
          {[
            ["ENTRY", "RSI(14) crosses above 30", "brand"],
            ["FILTER", "price > EMA(200)", "iris"],
            ["EXIT", "RSI(14) > 62  OR  stop hit", "brand"],
          ].map(([tag, rule, tone]) => (
            <div
              key={rule}
              className="rounded-lg border border-white/[0.08] bg-ink-900/60 px-3 py-2.5 font-mono text-[12px] text-slate-200"
            >
              <span
                className={tone === "iris" ? "text-iris-400" : "text-brand-400"}
              >
                {tag}
              </span>{" "}
              {rule}
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-lg border border-warn/25 bg-warn/[0.06] px-3 py-2 text-[11px] text-warn">
            <AlertTriangle className="h-3.5 w-3.5" /> Add a take-profit to
            complete this rule
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-ink-950/50 p-3">
          <div className="mb-2 text-[11px] font-medium text-slate-400">
            Parameters
          </div>
          {[
            ["RSI length", "14"],
            ["EMA filter", "200"],
            ["Timeframe", "4h / 1h"],
            ["Direction", "Long"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between border-b border-white/[0.05] py-2 text-[12px] last:border-0"
            >
              <span className="text-slate-400">{k}</span>
              <span className="tabular font-medium text-white">{v}</span>
            </div>
          ))}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["RSI", "EMA", "MACD", "BB", "VOL"].map((t) => (
              <span
                key={t}
                className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BacktestMock() {
  return (
    <div>
      <MockHeader title="backtest · BTC-USDT · 1h" />
      <div className="rounded-xl border border-white/[0.06] bg-ink-950/50 p-3">
        <svg viewBox="0 0 320 120" className="h-32 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,96 L26,88 L52,92 L78,74 L104,80 L130,60 L156,66 L182,44 L208,52 L234,34 L260,40 L286,22 L320,16"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M0,96 L26,88 L52,92 L78,74 L104,80 L130,60 L156,66 L182,44 L208,52 L234,34 L260,40 L286,22 L320,16 L320,120 L0,120 Z"
            fill="url(#eq)"
          />
        </svg>
        {/* drawdown strip */}
        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
          <span className="text-danger">▾ drawdown</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full w-[22%] rounded-full bg-danger/50" />
          </div>
          <span className="tabular text-danger">-14.2%</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["Net return", "+38.4%", "text-ok"],
          ["Profit factor", "1.8", "text-white"],
          ["Win rate", "57%", "text-white"],
          ["Max DD", "-14.2%", "text-danger"],
          ["Trades", "214", "text-white"],
          ["Expectancy", "0.42R", "text-white"],
        ].map(([k, v, tone]) => (
          <div
            key={k}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
          >
            <div className="text-[10px] text-slate-400">{k}</div>
            <div className={`tabular text-sm font-semibold ${tone}`}>{v}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        Historical simulations are hypothetical and do not guarantee future
        performance.
      </p>
    </div>
  );
}

function RiskMock() {
  return (
    <div>
      <MockHeader title="risk profile · balanced" />
      <div className="flex items-center gap-4">
        <Gauge className="h-10 w-10 text-brand-400" />
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Risk budget used today</span>
            <span className="tabular font-medium text-white">34%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-[34%] rounded-full bg-gradient-to-r from-ok to-warn" />
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {[
          ["Risk per trade", "1.0%"],
          ["Max daily loss", "3.0%"],
          ["Leverage cap", "10×"],
          ["Consecutive-loss pause", "3 losses"],
        ].map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px]"
          >
            <span className="text-slate-400">{k}</span>
            <span className="tabular font-medium text-white">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-danger/25 bg-danger/[0.06] px-3.5 py-2.5">
        <span className="text-[12px] font-medium text-slate-200">
          Daily loss limit reached → agent paused
        </span>
        <button className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-semibold text-white">
          <Power className="h-3 w-3 text-danger" /> Kill switch
        </button>
      </div>
    </div>
  );
}

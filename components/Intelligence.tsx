import { Waves, Newspaper, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import { site } from "@/lib/site";

const cards = [
  {
    icon: Waves,
    tag: "Whale Tracker",
    title: "Follow the wallets that move markets",
    body: "Search addresses, monitor large positions and get alerts when tracked wallets open, close or transfer size.",
    cta: "Browse live activity",
    rows: [
      "0x7A…19F opened BTC long · $4.2M · 8.5×",
      "0x3C…8B2 closed ETH short · $1.1M",
      "Bridge · 2,400 SOL → exchange",
    ],
  },
  {
    icon: Newspaper,
    tag: "News & Events",
    title: "Know what moved the market — and what's next",
    body: "Verified crypto news, macro releases and ETF flows, organized by impact and timing, not noise.",
    cta: "View priority feed",
    rows: [
      "High impact · CPI release in 2h",
      "Medium · ETF net inflow +$180M",
      "Macro · Rate decision Thursday",
    ],
  },
];

export default function Intelligence() {
  return (
    <section id="intelligence" className="section">
      <div className="container">
        <Reveal className="mb-10 text-center">
          <span className="eyebrow">Included free</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Free market intelligence,{" "}
            <span className="gradient-text">built into your workflow</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            Utilities that create a daily habit — and feed straight into your
            strategy ideas and risk controls.
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((c, i) => (
            <Reveal key={c.tag} delay={i * 0.08}>
              <a
                href={site.appUrl}
                className="glass glass-hover group flex h-full flex-col p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-brand-400">
                      <c.icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {c.tag}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-white">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {c.body}
                </p>

                <div className="mt-4 space-y-1.5">
                  {c.rows.map((r) => (
                    <div
                      key={r}
                      className="tabular rounded-lg border border-white/[0.06] bg-ink-950/50 px-3 py-2 font-mono text-[11px] text-slate-300"
                    >
                      {r}
                    </div>
                  ))}
                </div>

                <span className="mt-4 text-sm font-medium text-brand-400">
                  {c.cta} →
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Data shown is an illustrative sample. Live feeds label source and
          freshness on every panel.
        </p>
      </div>
    </section>
  );
}

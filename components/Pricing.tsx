import { Check, ShieldCheck, Zap, BarChart3, Lock } from "lucide-react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { plans, planFeatures, site } from "@/lib/site";

// Explicit class strings per accent so Tailwind's JIT keeps them.
const accents = {
  brand: {
    text: "text-brand-400",
    ring: "hover:border-brand-400/40",
    free: "bg-brand-500/15 text-brand-300 border-brand-400/30",
    check: "text-brand-400",
    btn: "from-sky-400 to-sky-600",
    glowBorder: "border-brand-400/30",
  },
  ok: {
    text: "text-ok",
    ring: "hover:border-ok/40",
    free: "bg-ok/15 text-ok border-ok/30",
    check: "text-ok",
    btn: "from-emerald-400 to-emerald-600",
    glowBorder: "border-ok/30",
  },
  iris: {
    text: "text-iris-400",
    ring: "hover:border-iris-400/40",
    free: "bg-iris-500/15 text-iris-300 border-iris-400/30",
    check: "text-iris-400",
    btn: "from-violet-400 to-violet-600",
    glowBorder: "border-iris-400/30",
  },
  warn: {
    text: "text-warn",
    ring: "hover:border-warn/40",
    free: "bg-warn/15 text-warn border-warn/30",
    check: "text-warn",
    btn: "from-amber-300 to-amber-500",
    glowBorder: "border-warn/40",
  },
} as const;

const strip = [
  { icon: ShieldCheck, title: "Risk Managed", body: "Protect capital with advanced tools" },
  { icon: Zap, title: "Auto Trade", body: "Automate strategies and save time" },
  { icon: BarChart3, title: "Backtest", body: "Test strategies on historical data" },
  { icon: Lock, title: "Secure & Reliable", body: "Encrypted, trading-only access" },
];

export default function Pricing() {
  return (
    <section id="pricing" className="section">
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 mx-auto h-[300px] max-w-4xl rounded-full bg-iris-500/10 blur-[120px]" />
      <div className="container">
        <SectionHeading
          eyebrow="Plans"
          title={
            <>
              Choose your <span className="gradient-text">plan</span>
            </>
          }
          sub="Unlock powerful trading tools, auto trading, backtesting and risk management. Longer terms add free months — same full toolset on every plan."
        />

        <div className="mt-14 grid gap-4 lg:grid-cols-4">
          {plans.map((p, i) => {
            const a = accents[p.accent];
            return (
              <Reveal key={p.id} delay={i * 0.07}>
                <div
                  className={`glass glass-hover relative flex h-full flex-col p-6 ${a.ring} ${
                    p.highlight ? `${a.glowBorder} shadow-glow` : ""
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-3 right-5 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-950">
                      {p.badge}
                    </span>
                  )}

                  <div className={`text-sm font-bold uppercase tracking-wide ${a.text}`}>
                    {p.term}
                  </div>

                  <div className="mt-3 flex items-end gap-1">
                    <span className="tabular text-5xl font-extrabold text-white">
                      ${p.price}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{p.per}</div>

                  {p.freeLabel && (
                    <span
                      className={`mt-3 inline-flex w-fit rounded-lg border px-2.5 py-1 text-xs font-bold ${a.free}`}
                    >
                      {p.freeLabel}
                    </span>
                  )}

                  {p.wasPrice && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="tabular text-slate-500 line-through">
                        ${p.wasPrice}
                      </span>
                      <span className={`tabular font-semibold ${a.text}`}>
                        Save ${p.save}
                      </span>
                    </div>
                  )}

                  <div className="my-5 h-px bg-white/[0.07]" />

                  <ul className="space-y-2.5">
                    {planFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                        <span className={`grid h-4 w-4 place-items-center rounded-full ${a.check}`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={site.appUrl}
                    className={`mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r ${a.btn} px-5 py-3 text-sm font-bold text-ink-950 transition-transform hover:-translate-y-0.5`}
                  >
                    Get Started
                  </a>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* bottom trust strip */}
        <Reveal delay={0.1}>
          <div className="mt-6 grid gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 sm:grid-cols-2 lg:grid-cols-4">
            {strip.map((s) => (
              <div key={s.title} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-brand-400">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{s.title}</div>
                  <div className="text-xs text-slate-400">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <p className="mt-6 text-center text-xs text-slate-500">
          Prices are placeholders — confirm in checkout. Trading involves risk;
          plans unlock tools, not returns.
        </p>
      </div>
    </section>
  );
}

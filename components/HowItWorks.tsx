import { PenLine, SlidersHorizontal, FlaskConical, Rocket } from "lucide-react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { site } from "@/lib/site";

const steps = [
  {
    n: "01",
    icon: PenLine,
    title: "Define",
    body: "Write your rules in plain English or start from a proven template.",
  },
  {
    n: "02",
    icon: SlidersHorizontal,
    title: "Fine-tune",
    body: "Edit indicators, timeframes, conditions, entries and exits — every value stays editable.",
  },
  {
    n: "03",
    icon: FlaskConical,
    title: "Validate",
    body: "Backtest with fees, slippage and risk metrics, then paper trade risk-free.",
  },
  {
    n: "04",
    icon: Rocket,
    title: "Run",
    body: "Assign capital, connect a supported venue, activate, monitor and pause anytime.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From strategy idea to controlled automation in{" "}
              <span className="gradient-text">four stages.</span>
            </>
          }
          sub="Test in history, dry-run in paper, and go live only when you decide. That order is the whole point."
        />

        <div className="relative mt-14">
          {/* connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-[42px] hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className="glass glass-hover h-full p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-brand-400">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <span className="tabular text-2xl font-bold text-white/10">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.1} className="mt-10 text-center">
          <a href={site.appUrl} className="btn-primary">
            Build a Strategy
          </a>
        </Reveal>
      </div>
    </section>
  );
}

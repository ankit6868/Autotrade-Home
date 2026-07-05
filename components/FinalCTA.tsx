import { ArrowRight, PenLine, FlaskConical, ShieldCheck, Bot } from "lucide-react";
import Reveal from "./Reveal";
import { site } from "@/lib/site";

const stages = [
  { icon: PenLine, label: "Draft" },
  { icon: FlaskConical, label: "Backtest" },
  { icon: ShieldCheck, label: "Paper" },
  { icon: Bot, label: "Live" },
];

export default function FinalCTA() {
  return (
    <section className="section">
      <div className="container">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-ink-800 to-ink-950 p-8 text-center shadow-card sm:p-14">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-60" />
            <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[640px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px]" />

            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Your strategy already has rules. Give them a{" "}
              <span className="gradient-text">disciplined execution partner.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              Start with a draft, test in historical data, move to paper mode,
              and activate live trading only when you decide.
            </p>

            {/* stage rail */}
            <div className="mx-auto mt-8 flex max-w-md items-center justify-between">
              {stages.map((s, i) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-brand-400">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {s.label}
                    </span>
                  </div>
                  {i < stages.length - 1 && (
                    <ArrowRight className="mb-5 h-4 w-4 text-white/20" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <a href={site.appUrl} className="btn-primary !px-6 !py-3.5 text-base">
                Build Your Strategy <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#how" className="btn-ghost !px-6 !py-3.5 text-base">
                Explore the Demo
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              No deposit to start · No withdrawal access · Cancel anytime
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

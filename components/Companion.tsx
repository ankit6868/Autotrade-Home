import { Check, AlertTriangle, ShieldCheck, MessageSquareText } from "lucide-react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import { site } from "@/lib/site";

const abilities = [
  "Translates plain-English ideas into editable logic",
  "Explains what each setting actually does",
  "Flags missing exit and risk rules before you run",
  "Summarizes backtests and live activity in words",
  "Never changes a live rule without your approval",
];

export default function Companion() {
  return (
    <section id="product" className="section">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            center={false}
            eyebrow="Meet your companion"
            title={
              <>
                A trading partner trained on your rules —{" "}
                <span className="gradient-text">not a black box.</span>
              </>
            }
            sub="Describe the idea, inspect the logic, adjust every parameter, and approve every change before it reaches paper or live execution."
          />
          <ul className="mt-8 space-y-3">
            {abilities.map((a, i) => (
              <Reveal as="li" key={a} delay={i * 0.06}>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ok/15 text-ok">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-sm text-slate-300">{a}</span>
                </li>
              </Reveal>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={site.appUrl} className="btn-primary">
              Try the Strategy Assistant
            </a>
            <a href={site.appUrl} className="btn-ghost">
              Start from a Template
            </a>
          </div>
        </div>

        {/* companion interaction mock */}
        <Reveal delay={0.1}>
          <div className="glass p-5 shadow-card sm:p-6">
            {/* user prompt */}
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-bold text-slate-300">
                You
              </span>
              <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-ink-900/70 px-4 py-3 text-sm text-slate-200">
                Enter when RSI recovers above 30, but only in a long-term
                uptrend.
              </div>
            </div>

            {/* companion reply */}
            <div className="mt-5 flex items-start gap-3">
              <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-iris-500">
                <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
                <span className="absolute inset-0 animate-pulse-ring rounded-full ring-2 ring-brand-400/40" />
              </span>
              <div className="flex-1 space-y-3">
                <div className="rounded-2xl rounded-tl-sm border border-brand-400/20 bg-brand-500/[0.06] px-4 py-3 text-sm text-slate-200">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-brand-400">
                    <MessageSquareText className="h-3.5 w-3.5" /> Here&apos;s how
                    I read that:
                  </div>
                  <div className="space-y-1.5 font-mono text-[12px] leading-relaxed">
                    <div className="rounded-lg bg-ink-950/60 px-3 py-2">
                      <span className="text-brand-400">ENTRY</span> · RSI(14)
                      crosses above 30
                    </div>
                    <div className="rounded-lg bg-ink-950/60 px-3 py-2">
                      <span className="text-iris-400">FILTER</span> · price &gt;
                      EMA(200) on 4h
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-warn/25 bg-warn/[0.06] px-3.5 py-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                  <p className="text-[13px] text-slate-200">
                    No exit or stop-loss defined yet. Want me to add a
                    structural stop and a target before we test?
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="btn-primary !px-3.5 !py-2 !text-xs">
                    Approve & continue
                  </button>
                  <span className="chip !text-[11px]">
                    <ShieldCheck className="h-3 w-3 text-ok" /> Requires your
                    approval
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

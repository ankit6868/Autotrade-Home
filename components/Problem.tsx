import { Shuffle, EyeOff, Flame } from "lucide-react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const cards = [
  {
    icon: Shuffle,
    title: "Rule Drift",
    body: "Changing your criteria after the market moves — the plan quietly becomes improvisation.",
  },
  {
    icon: EyeOff,
    title: "Screen Fatigue",
    body: "Missing clean setups, or forcing trades that don't fit, because no one can watch every hour.",
  },
  {
    icon: Flame,
    title: "Emotional Escalation",
    body: "Increasing risk after a loss. One bad decision compounds into the next.",
  },
];

export default function Problem() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="The gap"
          title={
            <>
              Most strategies don&apos;t fail at the idea.
              <br className="hidden sm:block" /> They fail in{" "}
              <span className="gradient-text">execution.</span>
            </>
          }
          sub="Late entries, skipped stops, overtrading and revenge trading can turn a reasonable plan into a sequence of emotional decisions."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <div className="glass glass-hover h-full p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-danger">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {c.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-brand-400/20 bg-brand-500/[0.05] p-6 text-center">
            <p className="text-base text-slate-200 sm:text-lg">
              TradingLab AI helps convert decisions into{" "}
              <span className="font-semibold text-white">pre-approved rules</span>{" "}
              — so your best thinking runs even when you can&apos;t.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

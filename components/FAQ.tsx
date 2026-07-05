"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const faqs = [
  {
    q: "Is this a signal bot or copy-trading scheme?",
    a: "No. It runs your rules — the ones you define, edit and approve. There are no black-box signals and no promise of returns; you build the logic and stay in control of it.",
  },
  {
    q: "Can the AI change my strategy on its own?",
    a: "No. The companion suggests and explains, but any material change to a live rule requires your explicit approval. Suggestions are always labelled as suggestions.",
  },
  {
    q: "Can I paper trade before risking real money?",
    a: "Yes — paper mode is the default. Dry-run any strategy with a virtual balance for as long as you like, then go live only when you decide.",
  },
  {
    q: "How are fees and slippage handled?",
    a: "Backtests model trading fees, funding and slippage with transparent, inspectable assumptions — so results reflect real execution conditions, not a frictionless ideal.",
  },
  {
    q: "What happens if my exchange API disconnects?",
    a: "Connection health is monitored continuously. On a disconnect the agent surfaces the error state and stops opening new positions; you're notified rather than left guessing.",
  },
  {
    q: "Can I pause instantly?",
    a: "Yes. Pause one agent or all agents at any time. Open positions keep their configured stop-loss and take-profit while new entries are halted.",
  },
  {
    q: "Do you custody my funds?",
    a: "Never. You connect a trading-only API key with withdrawals disabled. Your funds stay in your own exchange account at all times.",
  },
  {
    q: "Does backtesting guarantee future results?",
    a: "No. Historical simulations are hypothetical and do not guarantee future performance. Trading crypto futures carries a high risk of loss.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section">
      <div className="container max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title="Answers before you commit"
          sub="Control, exchanges, risk and ownership — the questions that actually matter."
        />
        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 0.03}>
                <div className="glass overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[15px] font-semibold text-white">
                      {f.q}
                    </span>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-brand-400">
                      {isOpen ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-200 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

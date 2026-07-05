"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  PlayCircle,
  SlidersHorizontal,
  LineChart,
  ShieldCheck,
  Bot,
  Check,
} from "lucide-react";
import { site } from "@/lib/site";

const chips = [
  { icon: SlidersHorizontal, label: "Visual strategy builder" },
  { icon: LineChart, label: "Risk-controlled backtesting" },
  { icon: Bot, label: "Paper & live automation" },
];

const steps = [
  { key: "edit", label: "Strategy Editor", state: "Rule defined", icon: SlidersHorizontal, tone: "text-brand-400" },
  { key: "test", label: "Backtest", state: "Running simulation", icon: LineChart, tone: "text-brand-400" },
  { key: "risk", label: "Risk Gate", state: "Limits approved", icon: ShieldCheck, tone: "text-ok" },
  { key: "run", label: "Agent", state: "Paper Mode: Active", icon: Bot, tone: "text-ok" },
];

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-36">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px]" />
        <div className="absolute right-[8%] top-[30%] h-[280px] w-[280px] rounded-full bg-iris-500/20 blur-[110px]" />
      </div>

      <div className="container grid items-center gap-14 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24">
        {/* Left: copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="chip mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
            </span>
            AI trading companion platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Turn your trading strategy into an{" "}
            <span className="gradient-text">AI agent that works beside you.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300"
          >
            Build and fine-tune your rules, test them against historical markets,
            apply advanced risk controls, and automate execution — without giving
            up control.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a href={site.appUrl} className="btn-primary">
              Build Your Strategy <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#how" className="btn-ghost">
              <PlayCircle className="h-4 w-4" /> Watch 60-sec Walkthrough
            </a>
          </motion.div>

          <p className="mt-4 text-sm text-slate-400">
            Start in paper mode. Connect an exchange only when you are ready.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {chips.map((c) => (
              <span key={c.label} className="chip">
                <c.icon className="h-3.5 w-3.5 text-brand-400" />
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: animated product workflow */}
        <HeroWorkflow />
      </div>
    </section>
  );
}

function HeroWorkflow() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Pause the loop when off-screen (content-map motion rule 3).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce) {
      setActive(3);
      return;
    }
    if (!visible) return;
    const t = setInterval(() => setActive((a) => (a + 1) % (steps.length + 1)), 2100);
    return () => clearInterval(t);
  }, [reduce, visible]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="relative"
    >
      <div className="glass relative overflow-hidden p-5 shadow-card sm:p-6">
        {/* window chrome */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
          </div>
          <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            Illustrative sample
          </span>
        </div>

        {/* the rule */}
        <div className="rounded-xl border border-white/[0.08] bg-ink-900/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
            <Bot className="h-3.5 w-3.5 text-iris-400" /> Strategy rule
          </div>
          <p className="font-mono text-[13px] leading-relaxed text-slate-200">
            <span className="text-brand-400">IF</span> RSI(14){" "}
            <span className="text-iris-400">crosses below</span> 30{" "}
            <span className="text-brand-400">AND</span> price{" "}
            <span className="text-iris-400">&gt;</span> EMA(200){" "}
            <span className="text-brand-400">THEN</span> open long
          </p>
        </div>

        {/* pipeline */}
        <div className="mt-4 space-y-2.5">
          {steps.map((s, i) => {
            const done = active > i;
            const isNow = active === i;
            return (
              <div
                key={s.key}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 ${
                  isNow
                    ? "border-brand-400/40 bg-brand-500/[0.07]"
                    : done
                    ? "border-white/[0.06] bg-white/[0.02]"
                    : "border-white/[0.05] bg-transparent opacity-60"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${
                    done || isNow
                      ? "border-white/10 bg-white/[0.05]"
                      : "border-white/[0.06]"
                  }`}
                >
                  {done ? (
                    <Check className="h-4 w-4 text-ok" />
                  ) : (
                    <s.icon className={`h-4 w-4 ${isNow ? s.tone : "text-slate-500"}`} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">{s.label}</div>
                  <div className="text-xs text-slate-400">{s.state}</div>
                </div>
                {isNow && (
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-brand-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
                    live
                  </span>
                )}
                {done && (
                  <span className="text-[11px] font-medium text-ok">ok</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-ok/20 bg-ok/[0.06] px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-ok">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ok" />
            </span>
            Agent status
          </span>
          <span className="tabular text-sm font-semibold text-white">
            {active >= steps.length ? "Paper Mode · Active" : "Preparing…"}
          </span>
        </div>
      </div>

      {/* floating metric cards */}
      <div className="glass absolute -left-4 -bottom-5 hidden items-center gap-3 p-3 sm:flex">
        <ShieldCheck className="h-5 w-5 text-ok" />
        <div>
          <div className="text-[11px] text-slate-400">Withdrawals</div>
          <div className="text-sm font-semibold text-white">Disabled</div>
        </div>
      </div>
      <div className="glass absolute -right-3 -top-4 hidden items-center gap-3 p-3 sm:flex">
        <LineChart className="h-5 w-5 text-brand-400" />
        <div>
          <div className="text-[11px] text-slate-400">Fees & slippage</div>
          <div className="text-sm font-semibold text-white">Modeled</div>
        </div>
      </div>
    </motion.div>
  );
}

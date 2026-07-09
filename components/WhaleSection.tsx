import Link from "next/link";
import { ArrowRight } from "lucide-react";
import WhaleLookup from "./whales/WhaleLookup";
import WhaleFeed from "./whales/WhaleFeed";
import Reveal from "./Reveal";

export default function WhaleSection() {
  return (
    <section id="whale-activity" className="section relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-1/4 top-8 h-[340px] w-[640px] rounded-full bg-brand-500/10 blur-[130px]" />
      </div>

      <div className="container grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left — headline + wallet lookup */}
        <Reveal>
          <span className="chip mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
            </span>
            Live gateway to Hyperliquid perps
          </span>

          <h2 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
            See every move the whales make,{" "}
            <span className="gradient-text">then move first.</span>
          </h2>

          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Look up any Hyperliquid wallet&apos;s live positions and PnL, watch whale-sized
            trades stream in real time, and decide whether to copy — all from public data.
          </p>

          <div className="glass mt-7 p-5 shadow-card sm:p-6">
            <WhaleLookup />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href="/whales" className="btn-ghost">
              Open full tracker <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-[12px] text-slate-500">
              Read-only · no sign-up · live Hyperliquid data
            </span>
          </div>
        </Reveal>

        {/* Right — live whale activity feed */}
        <Reveal delay={0.08} className="lg:pt-1">
          <WhaleFeed />
        </Reveal>
      </div>
    </section>
  );
}

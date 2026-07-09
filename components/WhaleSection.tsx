import Link from "next/link";
import { ArrowRight } from "lucide-react";
import WhaleLookup from "./whales/WhaleLookup";
import WhaleFeed from "./whales/WhaleFeed";
import WhaleMarkets from "./whales/WhaleMarkets";
import Reveal from "./Reveal";

export default function WhaleSection() {
  return (
    <section id="whale-activity" className="section">
      <div className="container">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Live · Hyperliquid whale tracker</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              See every move the whales make
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Look up any wallet&apos;s live positions &amp; PnL, watch whale-sized trades
              stream in real time, and read the market — right here, no sign-up.
            </p>
          </div>
          <Link href="/whales" className="btn-ghost">
            Open full tracker <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        {/* Wallet lookup — the interactive feature */}
        <Reveal delay={0.06} className="glass mb-4 p-5 shadow-card sm:p-6">
          <WhaleLookup />
        </Reveal>

        {/* Live feed + live markets */}
        <Reveal delay={0.1} className="grid gap-4 lg:grid-cols-2">
          <WhaleFeed compactMode />
          <WhaleMarkets />
        </Reveal>
      </div>
    </section>
  );
}

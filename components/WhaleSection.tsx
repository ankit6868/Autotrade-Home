import Link from "next/link";
import { ArrowRight } from "lucide-react";
import WhaleFeed from "./whales/WhaleFeed";
import Reveal from "./Reveal";

export default function WhaleSection() {
  return (
    <section id="whale-activity" className="section">
      <div className="container">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Live · Hyperliquid</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              See every move the whales make
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Real whale-sized trades streaming live from Hyperliquid — tap any wallet
              to open its full positions, PnL and stats.
            </p>
          </div>
          <Link href="/whales" className="btn-ghost">
            Open the whale tracker <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Reveal delay={0.08} className="mx-auto max-w-3xl">
          <WhaleFeed compactMode />
        </Reveal>
      </div>
    </section>
  );
}

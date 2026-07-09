import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhaleLookup from "@/components/whales/WhaleLookup";
import WhaleFeed from "@/components/whales/WhaleFeed";
import WhaleMarkets from "@/components/whales/WhaleMarkets";
import WhaleAggregate from "@/components/whales/WhaleAggregate";
import WhaleLiquidationMap from "@/components/whales/WhaleLiquidationMap";

export const metadata: Metadata = {
  title: "Whale Tracker — real-time Hyperliquid positions & flow",
  description:
    "Look up any Hyperliquid wallet's live positions and PnL, watch whale-sized trades stream in real time, and see live open interest, funding and volume. Read-only, no sign-up.",
};

export default function WhalesPage() {
  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero + wallet lookup */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-grid" />
            <div className="absolute left-1/3 top-0 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[120px]" />
          </div>
          <div className="container py-12 sm:py-16">
            <span className="chip mb-5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
              </span>
              Live gateway to Hyperliquid perps
            </span>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
              See every move the whales make,{" "}
              <span className="gradient-text">then move first.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              Look up any Hyperliquid wallet&apos;s live positions and PnL, watch whale-sized
              trades stream in real time, and read the market&apos;s open interest, funding and
              volume — all from Hyperliquid&apos;s public data. No sign-up.
            </p>

            <div className="glass mt-8 max-w-3xl p-5 shadow-card sm:p-6">
              <WhaleLookup />
            </div>
          </div>
        </section>

        {/* Tracked-whale aggregate + live feed */}
        <section className="container grid gap-4 lg:grid-cols-2">
          <WhaleAggregate />
          <WhaleFeed />
        </section>

        {/* Whale liquidation map + live markets */}
        <section className="container grid gap-4 pb-20 pt-4 lg:grid-cols-[1.3fr_0.7fr]">
          <WhaleLiquidationMap />
          <WhaleMarkets />
        </section>

        <p className="container -mt-12 mb-16 text-center text-[11px] text-slate-500">
          Data sourced live from Hyperliquid&apos;s public API. Read-only and informational —
          not trading advice. Aggregate long/short trader ratios require a third-party
          aggregator and are not shown here rather than estimated.
        </p>
      </main>
      <Footer />
    </>
  );
}

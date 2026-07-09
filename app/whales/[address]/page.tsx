import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WalletDashboard from "@/components/whales/WalletDashboard";

export const metadata: Metadata = {
  title: "Wallet — Hyperliquid positions, PnL & stats",
  description:
    "Live Hyperliquid wallet dashboard: account value, positions, PnL history, direction bias and recent trade stats. Read-only, from public data.",
};

export default function WalletPage({ params }: { params: { address: string } }) {
  const addr = (params.address || "").toLowerCase();
  const valid = /^0x[a-f0-9]{40}$/.test(addr);

  return (
    <>
      <Header />
      <main className="pt-20">
        {valid ? (
          <WalletDashboard address={addr} />
        ) : (
          <div className="container py-24 text-center">
            <p className="text-lg font-semibold text-white">Invalid wallet address</p>
            <p className="mt-2 text-sm text-slate-400">
              Expected a 42-character 0x… Hyperliquid address.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

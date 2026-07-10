import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/site";
import ScrollProgress from "@/components/ScrollProgress";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.appUrl),
  title: {
    default: `${site.brand} — AI Trading Companion for Crypto Futures`,
    template: `%s · ${site.brand}`,
  },
  description:
    "Turn your trading strategy into an editable, testable, risk-controlled AI agent. Build rules, backtest with fees & slippage, paper trade, then automate on your exchange — while you stay in control.",
  keywords: [
    "AI trading companion",
    "crypto trading bot",
    "strategy backtesting",
    "automated futures trading",
    "risk management",
    "paper trading",
    "KuCoin futures",
  ],
  openGraph: {
    title: `${site.brand} — AI Trading Companion`,
    description:
      "Build your strategy. Test every rule. Automate with discipline — while you stay in control.",
    url: site.appUrl,
    siteName: site.brand,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: site.brand },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}

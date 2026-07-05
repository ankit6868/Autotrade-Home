// ─────────────────────────────────────────────────────────────────────────
// Single source of truth for brand, links and pricing.
// Change BRAND / APP_URL here and it updates across the whole site.
// ─────────────────────────────────────────────────────────────────────────

export const site = {
  brand: "TradingLab AI",
  brandShort: "TradingLab",
  // The actual trading app the CTAs open (sign-up / build-a-strategy).
  appUrl: "https://autotrade-hub.vercel.app",
  signInUrl: "https://autotrade-hub.vercel.app",
  tagline: "Your strategy, now with an AI trading companion.",
  // Core promise (content-map §Recommended core promise).
  promise:
    "Build your strategy. Test every rule. Let your AI trading companion execute with discipline — while you stay in control.",
  email: "hello@tradinglab.ai",
  social: {
    x: "#",
    telegram: "#",
    github: "https://github.com/ankit6868",
  },
} as const;

// Duration-based plans (from the provided pricing design). All plans unlock the
// same toolset; longer terms add free months. Prices are placeholders you can
// adjust — keep them honest and in sync with checkout.
export type Plan = {
  id: string;
  term: string;
  price: number;
  per: string;
  badge?: string;
  freeLabel?: string;
  wasPrice?: number;
  save?: number;
  accent: "brand" | "ok" | "iris" | "warn";
  highlight?: boolean;
};

export const plans: Plan[] = [
  { id: "m1", term: "1 Month", price: 6, per: "per month", accent: "brand" },
  {
    id: "m3",
    term: "3 Months",
    price: 18,
    per: "billed quarterly",
    freeLabel: "1 Month Free",
    wasPrice: 24,
    save: 6,
    accent: "ok",
  },
  {
    id: "m6",
    term: "6 Months",
    price: 36,
    per: "billed half-yearly",
    freeLabel: "3 Months Free",
    wasPrice: 54,
    save: 18,
    accent: "iris",
  },
  {
    id: "m12",
    term: "12 Months",
    price: 72,
    per: "billed yearly",
    freeLabel: "8 Months Free",
    wasPrice: 120,
    save: 48,
    accent: "warn",
    badge: "Best Value",
    highlight: true,
  },
];

export const planFeatures = [
  "Strategy Builder",
  "Backtesting",
  "Auto Trading",
  "Risk Management",
  "Performance Analytics",
  "Multi-Exchange Support",
  "24/7 Support",
];

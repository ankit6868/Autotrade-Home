import { Github, Send, Twitter } from "lucide-react";
import { site } from "@/lib/site";

const cols = [
  {
    title: "Product",
    links: [
      ["Strategy Builder", site.appUrl],
      ["Backtesting", site.appUrl],
      ["Risk Engine", "#workstation"],
      ["Automation", site.appUrl],
    ],
  },
  {
    title: "Explore",
    links: [
      ["Whale Tracker", "#intelligence"],
      ["News & Events", "#intelligence"],
      ["Pricing", "#pricing"],
      ["FAQ", "#faq"],
    ],
  },
  {
    title: "Company",
    links: [
      ["Security", "#security"],
      ["Status", "#"],
      ["Documentation", "#"],
      ["Contact", `mailto:${site.email}`],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms", "#"],
      ["Privacy", "#"],
      ["Risk Disclosure", "#risk"],
      ["Not investment advice", "#risk"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-ink-950">
      <div className="container py-14">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-iris-500">
                <span className="h-3.5 w-3.5 rounded-[3px] bg-ink-950" />
              </span>
              <span className="text-[15px] font-bold text-white">
                {site.brandShort}
                <span className="text-brand-400">.ai</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              An AI trading companion that turns your rules into a tested,
              risk-controlled agent — while you stay in control.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { icon: Twitter, href: site.social.x, label: "X (Twitter)" },
                { icon: Send, href: site.social.telegram, label: "Telegram" },
                { icon: Github, href: site.social.github, label: "GitHub" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 transition-colors hover:border-white/25 hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-semibold text-white">{c.title}</div>
              <ul className="mt-4 space-y-2.5">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* risk disclosure */}
        <div
          id="risk"
          className="mt-12 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 text-xs leading-relaxed text-slate-500"
        >
          <span className="font-semibold text-slate-400">Risk disclosure — </span>
          {site.brand} is trading-automation software, not financial advice.
          Trading cryptocurrency futures with leverage carries a high risk of
          loss and is not suitable for everyone. Backtested and historical
          performance is hypothetical and does not guarantee future results. You
          are solely responsible for your trading decisions and any losses. Only
          trade with capital you can afford to lose.
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-slate-500 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {site.brand}. All rights reserved.
          </span>
          <span>Built for traders who value proof over hype.</span>
        </div>
      </div>
    </footer>
  );
}

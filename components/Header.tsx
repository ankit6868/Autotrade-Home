"use client";

import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { site } from "@/lib/site";

const nav = [
  { label: "Product", href: "/#product" },
  { label: "Whale Tracker", href: "/whales" },
  { label: "News", href: "/#intelligence" },
  { label: "Pricing", href: "/#pricing" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/[0.08] bg-ink-950/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[15px] font-bold tracking-tight text-white">
            {site.brandShort}
            <span className="text-brand-400">.ai</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a href={site.signInUrl} className="btn-ghost !px-4 !py-2 !text-sm">
            Sign In
          </a>
          <a href={site.appUrl} className="btn-primary !px-4 !py-2 !text-sm">
            Build Your Strategy <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile: keep primary CTA visible beside the hamburger. */}
        <div className="flex items-center gap-2 md:hidden">
          <a href={site.appUrl} className="btn-primary !px-3.5 !py-2 !text-xs">
            Build
          </a>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-white"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/[0.08] bg-ink-950/95 backdrop-blur-xl md:hidden">
          <div className="container flex flex-col py-3">
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-200"
              >
                {n.label}
              </a>
            ))}
            <a
              href={site.signInUrl}
              className="mt-2 rounded-lg px-3 py-3 text-sm font-medium text-slate-400"
            >
              Sign In
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Logo() {
  return (
    <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-iris-500 shadow-glow">
      <span className="h-3.5 w-3.5 rounded-[3px] bg-ink-950" />
      <span className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
    </span>
  );
}

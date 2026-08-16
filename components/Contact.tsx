"use client";

import { useState } from "react";
import { ArrowRight, Mail, MessageCircle, Check, Loader2, Sparkles } from "lucide-react";
import Reveal from "./Reveal";
import { site } from "@/lib/site";

const INTERESTS = [
  "Strategy Builder",
  "Backtesting",
  "Auto Trading",
  "Whale Tracker",
  "Pricing / Plans",
  "Partnership",
];

const PORTFOLIOS = [
  "Just exploring",
  "Under $1k",
  "$1k – $10k",
  "$10k – $100k",
  "$100k+",
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [portfolio, setPortfolio] = useState(PORTFOLIOS[0]);
  const [interests, setInterests] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const toggle = (i: string) =>
    setInterests((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!email.trim() && !phone.trim()) return setError("Add an email or phone so we can reach you.");
    setState("sending");
    try {
      const r = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, portfolio, interests, message, company }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d?.error || "Couldn't send — please try again.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Network error — please try again.");
      setState("idle");
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-brand-400/60";
  const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400";

  return (
    <section id="contact" className="section">
      <div className="container">
        <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          {/* Left — pitch + direct contact */}
          <Reveal>
            <div>
              <span className="eyebrow">
                <Sparkles className="h-3.5 w-3.5" /> Talk to us
              </span>
              <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Speak directly with the{" "}
                <span className="gradient-text">{site.brandShort} team.</span>
              </h2>
              <p className="mt-4 max-w-md text-slate-300">
                New here? Tell us what you trade and what you want to automate — we&apos;ll
                point you to the right place, answer questions, and help you get set up.
              </p>

              <div className="mt-8 space-y-4">
                <a
                  href={`mailto:${site.email}`}
                  className="glass glass-hover flex items-center gap-3 rounded-xl px-4 py-3.5"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-brand-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[11px] uppercase tracking-[0.14em] text-slate-500">Email</span>
                    <span className="text-sm text-slate-200">{site.email}</span>
                  </span>
                </a>
                <div className="glass flex items-center gap-3 rounded-xl px-4 py-3.5">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-brand-400">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[11px] uppercase tracking-[0.14em] text-slate-500">Typical reply</span>
                    <span className="text-sm text-slate-200">Within one trading session</span>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right — the form */}
          <Reveal delay={0.08}>
            <div className="gradient-border rounded-3xl border border-white/[0.08] bg-gradient-to-b from-ink-800 to-ink-950 p-6 shadow-card sm:p-8">
              {state === "done" ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl border border-ok/30 bg-ok/10 text-ok">
                    <Check className="h-7 w-7" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-white">Message received</h3>
                  <p className="mt-2 max-w-xs text-sm text-slate-400">
                    Thanks{name ? `, ${name.split(" ")[0]}` : ""} — we&apos;ll get back to you
                    at {email || phone}. Meanwhile, you can start building right away.
                  </p>
                  <a href={site.appUrl} className="btn-primary mt-6">
                    Open {site.brandShort} <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <h3 className="text-lg font-bold text-white">Send us a note</h3>
                  <p className="mt-1 text-sm text-slate-400">No spam, ever. We only use this to reply.</p>

                  {/* honeypot — visually hidden */}
                  <input
                    type="text" name="company" tabIndex={-1} autoComplete="off"
                    value={company} onChange={(e) => setCompany(e.target.value)}
                    className="absolute left-[-9999px] h-0 w-0 opacity-0" aria-hidden="true"
                  />

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Full name</label>
                      <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                    </div>
                    <div>
                      <label className={labelCls}>Phone / Telegram</label>
                      <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98…" />
                    </div>
                    <div>
                      <label className={labelCls}>Portfolio size</label>
                      <select className={`${inputCls} appearance-none`} value={portfolio} onChange={(e) => setPortfolio(e.target.value)}>
                        {PORTFOLIOS.map((p) => (
                          <option key={p} value={p} className="bg-ink-800">{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={labelCls}>I&apos;m interested in</label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((i) => {
                        const on = interests.includes(i);
                        return (
                          <button
                            key={i} type="button" onClick={() => toggle(i)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              on
                                ? "border-brand-400/60 bg-brand-500/15 text-brand-400"
                                : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-white/20"
                            }`}
                          >
                            {i}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={labelCls}>Message</label>
                    <textarea
                      className={`${inputCls} min-h-[110px] resize-y`} value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you're looking for…"
                    />
                  </div>

                  {error && (
                    <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
                  )}

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500">By sending, you agree to be contacted about {site.brand}.</p>
                    <button type="submit" disabled={state === "sending"} className="btn-primary shrink-0 disabled:opacity-60">
                      {state === "sending" ? (
                        <>Sending <Loader2 className="h-4 w-4 animate-spin" /></>
                      ) : (
                        <>Send message <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

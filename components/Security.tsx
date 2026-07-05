import { Check, X, Lock, KeyRound, FileClock, RefreshCcw } from "lucide-react";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const safeguards = [
  { icon: Lock, label: "API credentials encrypted at rest" },
  { icon: KeyRound, label: "Trading-only permissions" },
  { icon: FileClock, label: "Audit logs for every action" },
  { icon: RefreshCcw, label: "Connection health monitoring" },
];

const perms = [
  { label: "Read balances & market data", allowed: true },
  { label: "Place & manage orders", allowed: true },
  { label: "Withdraw funds", allowed: false },
  { label: "Transfer to other accounts", allowed: false },
];

export default function Security() {
  return (
    <section id="security" className="section">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            center={false}
            eyebrow="Security & control"
            title={
              <>
                Your keys, permissions and strategies{" "}
                <span className="gradient-text">stay under your control.</span>
              </>
            }
            sub="Funds never leave your exchange. You connect with a trading-only key — and any withdrawal permission is rejected by design."
          />
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {safeguards.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06}>
                <div className="glass flex items-center gap-3 p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-ok">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-slate-200">{s.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* permission modal mock */}
        <Reveal delay={0.1}>
          <div className="glass p-5 shadow-card sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                Connect exchange · API permissions
              </span>
              <span className="chip !text-[11px] !text-ok">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Verified
              </span>
            </div>
            <div className="space-y-2">
              {perms.map((p) => (
                <div
                  key={p.label}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    p.allowed
                      ? "border-ok/20 bg-ok/[0.05]"
                      : "border-danger/20 bg-danger/[0.05]"
                  }`}
                >
                  <span className="text-sm text-slate-200">{p.label}</span>
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full ${
                      p.allowed
                        ? "bg-ok/15 text-ok"
                        : "bg-danger/15 text-danger"
                    }`}
                  >
                    {p.allowed ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-ink-900/60 px-4 py-3 text-center text-sm font-medium text-ok">
              Connection verified — trading only, withdrawals blocked.
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

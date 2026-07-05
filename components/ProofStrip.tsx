import {
  Blocks,
  Sliders,
  Receipt,
  ShieldAlert,
  Layers,
  Hand,
} from "lucide-react";
import Reveal from "./Reveal";

// Capability proof — NOT fake user metrics (content-map build note 03).
const caps = [
  { icon: Blocks, label: "No-code rule logic" },
  { icon: Sliders, label: "Indicator fine-tuning" },
  { icon: Receipt, label: "Fee-aware backtests" },
  { icon: ShieldAlert, label: "Advanced risk limits" },
  { icon: Layers, label: "Multiple strategy agents" },
  { icon: Hand, label: "Manual pause & override" },
];

export default function ProofStrip() {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.015]">
      <div className="container py-8">
        <p className="mb-5 text-center text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Everything needed to move from an idea to controlled execution
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {caps.map((c, i) => (
            <Reveal key={c.label} delay={i * 0.05}>
              <div className="glass glass-hover flex items-center gap-2.5 p-3.5">
                <c.icon className="h-4 w-4 shrink-0 text-brand-400" />
                <span className="text-[13px] font-medium text-slate-200">
                  {c.label}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

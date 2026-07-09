"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/* ── Donut ring ──────────────────────────────────────────────────────────── */
export function Donut({
  value,
  size = 64,
  thickness = 8,
  color = "var(--brand-400, #38bdf8)",
  track = "rgba(255,255,255,0.08)",
  children,
}: {
  value: number; // 0..100
  size?: number;
  thickness?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center text-[10px] font-semibold text-white">{children}</div>}
    </div>
  );
}

/* ── horizontal exposure bar ─────────────────────────────────────────────── */
export function Bar({ value, tone }: { value: number; tone: "ok" | "danger" | "brand" }) {
  const pct = Math.max(0, Math.min(100, value));
  const bg = tone === "ok" ? "bg-ok" : tone === "danger" ? "bg-danger" : "bg-brand-400";
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
      <div className={`h-full rounded-full ${bg}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── working dropdown (closes on outside-click / Escape) ─────────────────── */
export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  icon,
  className = "",
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
  icon?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-slate-200 transition-colors hover:border-white/20"
      >
        {icon}
        {current}
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1.5 min-w-[130px] overflow-hidden rounded-lg border border-white/10 bg-ink-900/95 py-1 shadow-xl backdrop-blur">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-white/[0.06] ${
                o.value === value ? "text-brand-300" : "text-slate-300"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type Trade = {
  id: string;
  coin: string;
  long: boolean;
  notional: number;
  size: number;
  px: number;
  time: number;
};

// Coins to watch + the whale threshold (USD notional). Trades below this are
// ignored so the feed only shows size that matters.
const COINS = ["BTC", "ETH", "SOL", "HYPE"];
const MIN_NOTIONAL = 100_000;

const compact = (n: number) => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const ago = (t: number) => {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

export default function WhaleFeed() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "down">("connecting");
  const [, force] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;

    function connect() {
      let ws: WebSocket;
      try {
        ws = new WebSocket("wss://api.hyperliquid.xyz/ws");
      } catch {
        setStatus("down");
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("live");
        COINS.forEach((coin) =>
          ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "trades", coin } })),
        );
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.channel !== "trades" || !Array.isArray(msg.data)) return;
          const fresh: Trade[] = [];
          for (const t of msg.data) {
            const px = Number(t.px);
            const sz = Number(t.sz);
            const notional = px * sz;
            if (notional < MIN_NOTIONAL) continue;
            fresh.push({
              id: `${t.coin}-${t.tid ?? t.hash ?? t.time}-${Math.random().toString(36).slice(2, 6)}`,
              coin: t.coin,
              long: t.side === "B",
              notional,
              size: sz,
              px,
              time: Number(t.time) || Date.now(),
            });
          }
          if (fresh.length) setTrades((prev) => [...fresh, ...prev].slice(0, 30));
        } catch {
          /* ignore malformed frame */
        }
      };

      ws.onclose = () => {
        if (closed) return;
        setStatus("down");
        retry = setTimeout(connect, 3000); // auto-reconnect
      };
      ws.onerror = () => ws.close();
    }

    connect();
    const tick = setInterval(() => force((n) => n + 1), 5000); // refresh "Xs ago"
    return () => {
      closed = true;
      clearInterval(tick);
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, []);

  return (
    <div className="glass p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <span className={`relative flex h-2 w-2 ${status === "live" ? "" : "opacity-50"}`}>
            {status === "live" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/70" />}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${status === "live" ? "bg-ok" : status === "down" ? "bg-danger" : "bg-warn"}`} />
          </span>
          Live whale activity
        </h3>
        <span className="text-[11px] text-slate-500">≥ {compact(MIN_NOTIONAL)} · {COINS.join(" · ")}</span>
      </div>

      {trades.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">
          {status === "down" ? "Reconnecting to Hyperliquid…" : "Watching for whale-sized trades…"}
        </div>
      ) : (
        <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
          {trades.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold ${t.long ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"}`}>
                {t.long ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {t.long ? "Long" : "Short"}
              </span>
              <span className="w-12 font-semibold text-white">{t.coin}</span>
              <span className="tabular flex-1 font-semibold text-slate-200">{compact(t.notional)}</span>
              <span className="tabular hidden text-[12px] text-slate-400 sm:inline">
                {t.size.toLocaleString("en-US", { maximumFractionDigits: 3 })} @ ${t.px.toLocaleString("en-US", { maximumFractionDigits: t.px < 10 ? 4 : 1 })}
              </span>
              <span className="w-16 text-right text-[11px] text-slate-500">{ago(t.time)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

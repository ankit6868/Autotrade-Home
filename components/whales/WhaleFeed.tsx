"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw } from "lucide-react";
import { fetchWhaleState } from "@/lib/hlPos";

type Whale = {
  key: string; // addr-coin (stable dedupe key → no remount on update)
  addr: string;
  coin: string;
  long: boolean; // trade aggressor side (buy = true)
  tradeNtl: number;
  tradeSz: number;
  tradePx: number;
  time: number;
  posValue?: number; // |current position value| from clearinghouseState
  posSize?: number; // signed position size (szi) — sign = real direction
};

// Fallback coins if the market list can't be fetched. The live list is loaded
// dynamically (top perps by 24h volume) so we track everything, not just BTC.
const FALLBACK_COINS = ["BTC", "ETH", "SOL", "HYPE", "XRP", "DOGE", "SUI", "AVAX", "LTC", "BNB"];
const MAX_COINS = 32;
const MIN_NOTIONAL = 50_000; // whale-sized taker trade
const MAX_ROWS = 60;
const REFRESH_SEC = 60;
const LS_KEY = "whale_feed_v1";
const STALE_MS = 6 * 60 * 60 * 1000;

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-2)}`;
const moneyFull = (n: number) =>
  "$ " + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const priceFmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { maximumFractionDigits: n >= 100 ? 1 : 4 });
const sizeFmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 5 });
const ago = (t: number) => {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 15) return "Just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  return `${h} hour${h > 1 ? "s" : ""} ago`;
};

// buy + long = Open Long · buy + short = Close Short · sell + long = Close Long · sell + short = Open Short
function activityOf(r: Whale) {
  const bought = r.long;
  if (r.posSize == null) return bought ? "Open Long" : "Open Short";
  const posLong = r.posSize > 0;
  return bought ? (posLong ? "Open Long" : "Close Short") : posLong ? "Close Long" : "Open Short";
}

async function loadCoins(): Promise<string[]> {
  try {
    const r = await fetch("/api/hl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    });
    const d = await r.json();
    const universe = d?.[0]?.universe || [];
    const ctxs = d?.[1] || [];
    const ranked = universe
      .map((u: { name: string }, i: number) => ({ name: u.name, vol: Number(ctxs[i]?.dayNtlVlm) || 0 }))
      .filter((c: { name: string }) => c.name && !c.name.startsWith("@"))
      .sort((a: { vol: number }, b: { vol: number }) => b.vol - a.vol)
      .slice(0, MAX_COINS)
      .map((c: { name: string }) => c.name);
    return ranked.length ? ranked : FALLBACK_COINS;
  } catch {
    return FALLBACK_COINS;
  }
}

const sortRows = (rows: Whale[]) => rows.sort((a, b) => b.time - a.time).slice(0, MAX_ROWS);

export default function WhaleFeed({ compactMode = false }: { compactMode?: boolean }) {
  const [rows, setRows] = useState<Whale[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "down">("connecting");
  const [countdown, setCountdown] = useState(REFRESH_SEC);
  const rowsRef = useRef<Whale[]>([]);
  const router = useRouter();

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Hydrate from localStorage so a refresh keeps the last-seen whales.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "[]") as Whale[];
      const fresh = (Array.isArray(saved) ? saved : []).filter((r) => r?.key && Date.now() - r.time < STALE_MS);
      if (fresh.length) {
        setRows((prev) => {
          const map = new Map(prev.map((r) => [r.key, r]));
          for (const r of fresh) if (!map.has(r.key)) map.set(r.key, r);
          return sortRows(Array.from(map.values()));
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!rows.length) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(rows));
    } catch {
      /* ignore quota */
    }
  }, [rows]);

  useEffect(() => {
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;
    let ws: WebSocket | null = null;

    function enrich(addr: string, force = false) {
      fetchWhaleState(addr, force).then((st) => {
        if (!st) return;
        setRows((prev) =>
          prev.map((r) => {
            if (r.addr !== addr) return r;
            const hit = st.positions.find((p) => p.coin === r.coin);
            return hit ? { ...r, posValue: hit.value, posSize: hit.szi } : r;
          }),
        );
      });
    }

    function connect(coins: string[]) {
      try {
        ws = new WebSocket("wss://api.hyperliquid.xyz/ws");
      } catch {
        setStatus("down");
        return;
      }
      const sock = ws;
      sock.onopen = () => {
        setStatus("live");
        coins.forEach((coin) => sock.send(JSON.stringify({ method: "subscribe", subscription: { type: "trades", coin } })));
      };
      sock.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.channel !== "trades" || !Array.isArray(msg.data)) return;
          const updates: Whale[] = [];
          for (const t of msg.data) {
            const px = Number(t.px);
            const ntl = px * Number(t.sz);
            if (ntl < MIN_NOTIONAL || !Array.isArray(t.users)) continue;
            const long = t.side === "B";
            const addr = long ? t.users[0] : t.users[1];
            if (!addr || !/^0x[a-f0-9]{40}$/i.test(addr)) continue;
            updates.push({
              key: `${addr.toLowerCase()}-${t.coin}`,
              addr: addr.toLowerCase(),
              coin: t.coin,
              long,
              tradeNtl: ntl,
              tradeSz: Number(t.sz),
              tradePx: px,
              time: Number(t.time) || Date.now(),
            });
          }
          if (!updates.length) return;
          setRows((prev) => {
            const map = new Map(prev.map((r) => [r.key, r]));
            for (const u of updates) {
              const ex = map.get(u.key);
              map.set(u.key, ex ? { ...u, posValue: ex.posValue, posSize: ex.posSize } : u);
            }
            return sortRows(Array.from(map.values()));
          });
          updates.forEach((u) => enrich(u.addr));
        } catch {
          /* ignore */
        }
      };
      sock.onclose = () => {
        if (closed) return;
        setStatus("down");
        retry = setTimeout(() => connect(coins), 3000);
      };
      sock.onerror = () => sock.close();
    }

    loadCoins().then((coins) => {
      if (!closed) connect(coins);
    });

    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          Array.from(new Set(rowsRef.current.map((r) => r.addr))).forEach((a) => enrich(a, true));
          return REFRESH_SEC;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      closed = true;
      clearInterval(tick);
      clearTimeout(retry);
      ws?.close();
    };
  }, []);

  const cols = "grid-cols-[0.85fr_1fr_1.15fr_0.85fr_0.8fr]";

  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <span className="relative flex h-2 w-2">
            {status === "live" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/70" />}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${status === "live" ? "bg-ok" : status === "down" ? "bg-danger" : "bg-warn"}`} />
          </span>
          Live Whale Activity
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-400">
          <RefreshCw className="h-3 w-3" /> Updated in {countdown}s
        </span>
      </div>

      <div className={`grid ${cols} gap-2 border-y border-white/[0.06] bg-white/[0.02] px-5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500`}>
        <span>Address</span>
        <span>Activity</span>
        <span className="text-right">Position Value</span>
        <span className="text-right">Price</span>
        <span className="text-right">Time</span>
      </div>

      {rows.length === 0 ? (
        <div className="py-14 text-center text-sm text-slate-500">
          {status === "down" ? "Reconnecting to Hyperliquid…" : "Watching for whale-sized trades…"}
        </div>
      ) : (
        <div className={`divide-y divide-white/[0.04] overflow-y-auto ${compactMode ? "max-h-[380px]" : "max-h-[520px]"}`}>
          {rows.map((r) => {
            const value = r.posValue != null ? r.posValue : r.tradeNtl;
            const size = r.posSize != null ? r.posSize : r.long ? r.tradeSz : -r.tradeSz;
            const activity = activityOf(r);
            return (
              <button
                key={r.key}
                onClick={() => router.push(`/whales/${r.addr}`)}
                className={`grid w-full ${cols} items-center gap-2 px-5 py-3 text-left transition-colors hover:bg-white/[0.03]`}
              >
                <span className="flex items-center gap-1.5 font-mono text-[13px] text-slate-200">
                  {short(r.addr)}
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(r.addr); }}
                    className="text-slate-500 hover:text-white"
                  >
                    <Copy className="h-3 w-3" />
                  </span>
                </span>
                <span className="leading-tight">
                  <span className="block text-[13px] font-semibold text-white">{r.coin}</span>
                  <span className={`text-[11px] font-semibold ${r.long ? "text-ok" : "text-danger"}`}>{activity}</span>
                </span>
                <span className="text-right">
                  <div className="tabular text-[13px] font-semibold text-slate-100">{moneyFull(value)}</div>
                  <div className="tabular text-[10px] text-slate-500">{sizeFmt(size)} {r.coin}</div>
                </span>
                <span className="tabular text-right text-[12px] text-slate-300">{priceFmt(r.tradePx)}</span>
                <span className="text-right text-[11px] text-slate-500">{ago(r.time)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

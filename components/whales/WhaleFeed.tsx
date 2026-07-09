"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

type Whale = {
  key: string; // addr-coin (stable dedupe key → no remount on update)
  addr: string;
  coin: string;
  long: boolean; // trade aggressor side (fallback direction until enriched)
  tradeNtl: number; // this trade's notional
  tradeSz: number; // this trade's size (unsigned)
  time: number;
  posValue?: number; // |current position value| from clearinghouseState
  posSize?: number; // signed position size (szi) — sign = real direction
};

// Majors + the most active perps, so the table fills quickly.
const COINS = ["BTC", "ETH", "SOL", "HYPE", "XRP", "DOGE", "SUI", "AVAX", "LTC", "BNB", "PEPE", "WLD"];
const MIN_NOTIONAL = 100_000; // whale-sized taker trade
const MAX_ROWS = 60;
const REFRESH_SEC = 60; // re-enrich every 60s

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-2)}`;
const moneyFull = (n: number) =>
  "$ " + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

// Per-address position cache so we can show real "Position Value" without
// hammering the API. 60s TTL, single in-flight request per address.
const posCache = new Map<string, { at: number; byCoin: Record<string, { value: number; size: number }> }>();
const inflight = new Set<string>();

async function fetchPositions(addr: string, force = false) {
  const c = posCache.get(addr);
  if (inflight.has(addr)) return c;
  if (!force && c && Date.now() - c.at < 60_000) return c;
  inflight.add(addr);
  try {
    const r = await fetch("/api/hl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "clearinghouseState", user: addr }),
    });
    const d = await r.json();
    const byCoin: Record<string, { value: number; size: number }> = {};
    for (const p of d?.assetPositions || []) {
      const pos = p.position;
      byCoin[pos.coin] = { value: Number(pos.positionValue), size: Number(pos.szi) };
    }
    const entry = { at: Date.now(), byCoin };
    posCache.set(addr, entry);
    return entry;
  } catch {
    return c;
  } finally {
    inflight.delete(addr);
  }
}

export default function WhaleFeed({ compactMode = false }: { compactMode?: boolean }) {
  const [rows, setRows] = useState<Whale[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "down">("connecting");
  const [countdown, setCountdown] = useState(REFRESH_SEC);
  const rowsRef = useRef<Whale[]>([]);
  const router = useRouter();

  // Keep a ref of current rows so the 60s refresh can read them without
  // re-subscribing the WebSocket.
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;

    // Apply enriched positions in place — never removes rows.
    function applyEnrich(addr: string, e?: { byCoin: Record<string, { value: number; size: number }> } | null) {
      if (!e) return;
      setRows((prev) =>
        prev.map((r) => {
          if (r.addr !== addr) return r;
          const hit = e.byCoin?.[r.coin];
          return hit ? { ...r, posValue: Math.abs(hit.value), posSize: hit.size } : r;
        }),
      );
    }
    function enrich(addr: string, force = false) {
      fetchPositions(addr, force).then((e) => applyEnrich(addr, e));
    }

    function connect() {
      let ws: WebSocket;
      try {
        ws = new WebSocket("wss://api.hyperliquid.xyz/ws");
      } catch {
        setStatus("down");
        return;
      }
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
          const updates: Whale[] = [];
          for (const t of msg.data) {
            const ntl = Number(t.px) * Number(t.sz);
            if (ntl < MIN_NOTIONAL || !Array.isArray(t.users)) continue;
            const long = t.side === "B"; // aggressor bought → long
            const addr = long ? t.users[0] : t.users[1]; // taker side
            if (!addr || !/^0x[a-f0-9]{40}$/i.test(addr)) continue;
            updates.push({
              key: `${addr.toLowerCase()}-${t.coin}`,
              addr: addr.toLowerCase(),
              coin: t.coin,
              long,
              tradeNtl: ntl,
              tradeSz: Number(t.sz),
              time: Number(t.time) || Date.now(),
            });
          }
          if (!updates.length) return;
          // Merge into existing rows — keep prior enrichment, never wipe.
          setRows((prev) => {
            const map = new Map(prev.map((r) => [r.key, r]));
            for (const u of updates) {
              const ex = map.get(u.key);
              map.set(u.key, ex ? { ...u, posValue: ex.posValue, posSize: ex.posSize } : u);
            }
            return Array.from(map.values()).sort((a, b) => b.time - a.time).slice(0, MAX_ROWS);
          });
          updates.forEach((u) => enrich(u.addr));
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        if (closed) return;
        setStatus("down");
        retry = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    }

    connect();

    // 1s tick: drives the "Updated in Xs" countdown, refreshes relative
    // times, and every 60s re-enriches every shown wallet's positions.
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          const addrs = Array.from(new Set(rowsRef.current.map((r) => r.addr)));
          addrs.forEach((a) => enrich(a, true));
          return REFRESH_SEC;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      closed = true;
      clearInterval(tick);
      clearTimeout(retry);
    };
  }, []);

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

      {/* header row */}
      <div className="grid grid-cols-[1fr_1.2fr_1.3fr_0.9fr] gap-2 border-y border-white/[0.06] bg-white/[0.02] px-5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <span>Address</span>
        <span>Direction</span>
        <span className="text-right">Position Value</span>
        <span className="text-right">Time</span>
      </div>

      {rows.length === 0 ? (
        <div className="py-14 text-center text-sm text-slate-500">
          {status === "down" ? "Reconnecting to Hyperliquid…" : "Watching for whale-sized trades…"}
        </div>
      ) : (
        <div className={`divide-y divide-white/[0.04] overflow-y-auto ${compactMode ? "max-h-[380px]" : "max-h-[540px]"}`}>
          {rows.map((r) => {
            const long = r.posSize != null ? r.posSize > 0 : r.long;
            const value = r.posValue != null ? r.posValue : r.tradeNtl;
            const size = r.posSize != null ? r.posSize : (r.long ? r.tradeSz : -r.tradeSz);
            return (
              <button
                key={r.key}
                onClick={() => router.push(`/whales/${r.addr}`)}
                className="grid w-full grid-cols-[1fr_1.2fr_1.3fr_0.9fr] items-center gap-2 px-5 py-3 text-left transition-colors hover:bg-white/[0.03]"
              >
                {/* address */}
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
                {/* direction */}
                <span className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold ${long ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"}`}>
                    {long ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {long ? "Long" : "Short"}
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[13px] font-semibold text-white">{r.coin}</span>
                    <span className="block text-[10px] text-slate-500">Cross</span>
                  </span>
                </span>
                {/* position value */}
                <span className="text-right">
                  <div className="tabular text-[13px] font-semibold text-slate-100">{moneyFull(value)}</div>
                  <div className="tabular text-[10px] text-slate-500">{sizeFmt(size)} {r.coin}</div>
                </span>
                {/* time */}
                <span className="text-right text-[11px] text-slate-500">{ago(r.time)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

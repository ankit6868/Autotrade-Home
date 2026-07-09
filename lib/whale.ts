// Shared helpers for the whale wallet dashboard — formatting + turning raw
// Hyperliquid fills into round-trip trades and trading statistics.

export const n = (v: unknown) => Number(v) || 0;

export const money = (v: number, d = 2) =>
  (v < 0 ? "-$" : "$") +
  Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const money0 = (v: number) => money(v, 0);

export const signed = (v: number, d = 2) =>
  (v >= 0 ? "+$" : "-$") +
  Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const compact = (v: number) => {
  const a = Math.abs(v);
  const s = v < 0 ? "-$" : "$";
  if (a >= 1e9) return `${s}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${s}${(a / 1e3).toFixed(1)}K`;
  return money(v);
};

export const pct = (v: number, d = 2) => `${v.toFixed(d)}%`;
export const sizeFmt = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 5 });

export function fmtDuration(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h < 24) return `${h}h ${mm}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function ago(t: number) {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  return `${Math.floor(h / 24)} day${Math.floor(h / 24) > 1 ? "s" : ""} ago`;
}

/* ── fills → round-trip trades ───────────────────────────────────────────── */
export type Fill = {
  coin: string;
  px: string;
  sz: string;
  side: "B" | "A"; // B = buy, A = sell
  time: number;
  dir: string;
  closedPnl: string;
  fee: string;
};

export type Trade = {
  coin: string;
  side: "Long" | "Short";
  openTime: number;
  closeTime: number;
  durationMs: number;
  realized: number; // closedPnl summed over the position (before fees)
  fees: number;
  net: number; // realized − fees
  size: number; // max abs size held
};

// Walk each coin's fills chronologically, tracking signed position size. Each
// time the position returns to (or crosses) zero, we close a round-trip trade.
export function groupTrades(fills: Fill[]): Trade[] {
  const byCoin: Record<string, Fill[]> = {};
  for (const f of fills) (byCoin[f.coin] ||= []).push(f);

  const trades: Trade[] = [];
  for (const coin of Object.keys(byCoin)) {
    const list = byCoin[coin].slice().sort((a, b) => a.time - b.time);
    let pos = 0;
    let openTime = 0;
    let realized = 0;
    let fees = 0;
    let maxSize = 0;
    let side: "Long" | "Short" = "Long";

    for (const f of list) {
      const delta = (f.side === "B" ? 1 : -1) * n(f.sz);
      const prev = pos;
      if (prev === 0) {
        openTime = f.time;
        side = delta > 0 ? "Long" : "Short";
        realized = 0;
        fees = 0;
        maxSize = 0;
      }
      fees += n(f.fee);
      realized += n(f.closedPnl);
      pos = Number((prev + delta).toFixed(10));
      maxSize = Math.max(maxSize, Math.abs(pos), Math.abs(prev));

      const closed = prev !== 0 && (pos === 0 || Math.sign(pos) !== Math.sign(prev));
      if (closed) {
        trades.push({
          coin,
          side,
          openTime,
          closeTime: f.time,
          durationMs: Math.max(0, f.time - openTime),
          realized,
          fees,
          net: realized - fees,
          size: maxSize,
        });
        if (pos !== 0) {
          // flipped straight through zero → a new position starts here
          openTime = f.time;
          side = pos > 0 ? "Long" : "Short";
          realized = 0;
          fees = 0;
          maxSize = Math.abs(pos);
        }
      }
    }
  }
  return trades.sort((a, b) => b.closeTime - a.closeTime);
}

export type Window = "1D" | "1W" | "1M" | "All";
export const windowMs = (w: Window) => (w === "1D" ? 1 : w === "1W" ? 7 : w === "1M" ? 30 : Infinity) * 86_400_000;
export const filterWindow = <T extends { closeTime: number }>(items: T[], w: Window) => {
  const cutoff = Date.now() - windowMs(w);
  return w === "All" ? items : items.filter((t) => t.closeTime >= cutoff);
};

export function computeStats(trades: Trade[]) {
  const wins = trades.filter((t) => t.net > 0);
  const closingPnl = trades.reduce((s, t) => s + t.realized, 0);
  const fees = trades.reduce((s, t) => s + t.fees, 0);
  const longNet = trades.filter((t) => t.side === "Long").reduce((s, t) => s + t.net, 0);
  const shortNet = trades.filter((t) => t.side === "Short").reduce((s, t) => s + t.net, 0);
  const durs = trades.map((t) => t.durationMs);
  const totalHold = durs.reduce((s, d) => s + d, 0);
  return {
    count: trades.length,
    winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
    wins: wins.length,
    losses: trades.length - wins.length,
    closingPnl,
    fees,
    net: closingPnl - fees,
    longNet,
    shortNet,
    totalHold,
    avgHold: trades.length ? totalHold / trades.length : 0,
    minHold: durs.length ? Math.min(...durs) : 0,
    maxHold: durs.length ? Math.max(...durs) : 0,
    top: [...trades].sort((a, b) => b.net - a.net).slice(0, 10),
  };
}

export type AssetStat = { coin: string; count: number; realized: number; fees: number; net: number };
export function perAsset(trades: Trade[]): AssetStat[] {
  const m: Record<string, AssetStat> = {};
  for (const t of trades) {
    const a = (m[t.coin] ||= { coin: t.coin, count: 0, realized: 0, fees: 0, net: 0 });
    a.count++;
    a.realized += t.realized;
    a.fees += t.fees;
    a.net += t.net;
  }
  return Object.values(m).sort((a, b) => b.net - a.net);
}

export type SideStat = { side: "Long" | "Short"; count: number; net: number };
export function perSide(trades: Trade[]): SideStat[] {
  const out: SideStat[] = (["Long", "Short"] as const).map((side) => {
    const sub = trades.filter((t) => t.side === side);
    return { side, count: sub.length, net: sub.reduce((s, t) => s + t.net, 0) };
  });
  return out;
}

// Max drawdown (%) from an account-value history series.
export function maxDrawdown(history: [number, string][] = []) {
  let peak = -Infinity;
  let mdd = 0;
  for (const [, v] of history) {
    const val = n(v);
    peak = Math.max(peak, val);
    if (peak > 0) mdd = Math.max(mdd, (peak - val) / peak);
  }
  return mdd * 100;
}

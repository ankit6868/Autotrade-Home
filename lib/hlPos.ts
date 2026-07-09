// Shared, cached fetch of a wallet's Hyperliquid perp state. Used by the live
// feed (row enrichment), the aggregate-stats panel, and the liquidation map —
// one 60s cache + single-flight per address means we never double-fetch.

export type PosLite = {
  coin: string;
  szi: number; // signed size (sign = direction)
  value: number; // |position value|
  entryPx: number;
  liqPx: number | null;
  marginUsed: number;
  uPnl: number;
  funding: number; // cumulative funding since open (paid = positive cost)
  leverage: number;
};
export type WhaleState = { addr: string; at: number; accountValue: number; positions: PosLite[] };

const cache = new Map<string, WhaleState>();
const inflight = new Map<string, Promise<WhaleState | null>>();

export const getCached = (addr: string) => cache.get(addr);

export async function fetchWhaleState(addr: string, force = false): Promise<WhaleState | null> {
  const c = cache.get(addr);
  if (!force && c && Date.now() - c.at < 60_000) return c;
  const running = inflight.get(addr);
  if (running) return running;

  const p = (async (): Promise<WhaleState | null> => {
    try {
      const r = await fetch("/api/hl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clearinghouseState", user: addr }),
      });
      const d = await r.json();
      const positions: PosLite[] = (d?.assetPositions || [])
        .map((x: { position: Record<string, unknown> & { leverage?: { value?: number }; cumFunding?: { sinceOpen?: string } } }) => {
          const p = x.position;
          return {
            coin: String(p.coin),
            szi: Number(p.szi) || 0,
            value: Math.abs(Number(p.positionValue) || 0),
            entryPx: Number(p.entryPx) || 0,
            liqPx: p.liquidationPx ? Number(p.liquidationPx) : null,
            marginUsed: Number(p.marginUsed) || 0,
            uPnl: Number(p.unrealizedPnl) || 0,
            funding: Number(p.cumFunding?.sinceOpen) || 0,
            leverage: Number(p.leverage?.value) || 0,
          };
        })
        .filter((p: PosLite) => p.szi !== 0);
      const st: WhaleState = { addr, at: Date.now(), accountValue: Number(d?.marginSummary?.accountValue) || 0, positions };
      cache.set(addr, st);
      return st;
    } catch {
      return c || null;
    } finally {
      inflight.delete(addr);
    }
  })();

  inflight.set(addr, p);
  return p;
}

// Concurrency-limited batch fetch.
export async function fetchWhaleStates(addrs: string[], force = false, concurrency = 6): Promise<WhaleState[]> {
  const out: WhaleState[] = [];
  let i = 0;
  async function worker() {
    while (i < addrs.length) {
      const a = addrs[i++];
      const s = await fetchWhaleState(a, force);
      if (s) out.push(s);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, addrs.length) }, worker));
  return out;
}

// The whale addresses we've seen streaming, pulled from the feed's persisted
// store (largest position first). This is our "tracked whales" universe.
export function trackedAddresses(limit = 100): string[] {
  try {
    const rows = JSON.parse(localStorage.getItem("whale_feed_v1") || "[]") as { addr: string; posValue?: number; time: number }[];
    const best = new Map<string, { posValue: number; time: number }>();
    for (const r of rows) {
      if (!r?.addr) continue;
      const cur = best.get(r.addr);
      if (!cur || (r.posValue || 0) > cur.posValue) best.set(r.addr, { posValue: r.posValue || 0, time: r.time });
    }
    return Array.from(best.entries())
      .sort((a, b) => b[1].posValue - a[1].posValue)
      .slice(0, limit)
      .map((e) => e[0]);
  } catch {
    return [];
  }
}

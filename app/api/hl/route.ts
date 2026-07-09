import { NextResponse } from "next/server";

// Server-side proxy to Hyperliquid's public `info` endpoint. Keeps the browser
// same-origin (no CORS surprises) and lets us cache/limit. No API key needed —
// Hyperliquid's info endpoint is fully public and read-only.
const HL_INFO = "https://api.hyperliquid.xyz/info";

// Only allow the read-only request types the tracker actually uses, so this
// proxy can never be turned into an open relay.
const ALLOWED = new Set([
  "clearinghouseState", // a wallet's perp positions + PnL
  "spotClearinghouseState", // a wallet's spot balances
  "portfolio", // account-value + PnL history (chart)
  "userFills", // recent fills → trading stats
  "frontendOpenOrders", // open orders
  "userFunding", // funding history
  "historicalOrders", // recent orders + status
  "userTwapSliceFills", // TWAP order fills
  "userNonFundingLedgerUpdates", // deposits / withdrawals / transfers
  "metaAndAssetCtxs", // per-coin market data (funding, OI, volume, price)
  "allMids", // mid prices
]);

// Request types that require a `user` address (validated below).
const USER_TYPES = new Set([
  "clearinghouseState",
  "spotClearinghouseState",
  "portfolio",
  "userFills",
  "frontendOpenOrders",
  "userFunding",
  "historicalOrders",
  "userTwapSliceFills",
  "userNonFundingLedgerUpdates",
]);

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { type?: string; user?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!body?.type || !ALLOWED.has(body.type)) {
    return NextResponse.json({ error: "unsupported request type" }, { status: 400 });
  }
  if (USER_TYPES.has(body.type)) {
    const u = (body.user || "").trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(u)) {
      return NextResponse.json({ error: "invalid_address" }, { status: 400 });
    }
    body.user = u;
  }
  try {
    const r = await fetch(HL_INFO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.ok ? 200 : r.status });
  } catch (e) {
    return NextResponse.json(
      { error: "upstream_unavailable", detail: String(e) },
      { status: 502 },
    );
  }
}

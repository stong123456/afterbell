import assert from "node:assert/strict";
import test from "node:test";
import { maybeEnhanceWithAi } from "../worker/ai.js";
import { fetchBlsCpi, fetchOkxMarkets, fetchOkxNews, fetchXLayerStatus } from "../worker/data-sources.js";
import { buildSnapshot } from "../worker/engine.js";
import { cachedSource } from "../worker/storage.js";

function ok(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function mockFetch(url, options = {}) {
  const href = String(url);
  if (href.includes("/api/v5/market/ticker")) {
    const instId = new URL(href).searchParams.get("instId");
    const rows = {
      "BTC-USDT": { last: "62000", open24h: "60000", bidPx: "61990", askPx: "62010", volCcy24h: "1000" },
      "ETH-USDT": { last: "3200", open24h: "3100", bidPx: "3199", askPx: "3201", volCcy24h: "8000" },
      "PAXG-USDT": { last: "2450", open24h: "2440", bidPx: "2449", askPx: "2451", volCcy24h: "200" },
    };
    return Promise.resolve(ok({ code: "0", data: [{ instId, ts: "1786665600000", ...rows[instId] }] }));
  }
  if (href.includes("api.bls.gov")) {
    assert.equal(options.method, "POST");
    return Promise.resolve(ok({
      Results: {
        series: [{
          data: [
            { year: "2026", period: "M06", periodName: "June", value: "320.0" },
            { year: "2026", period: "M05", periodName: "May", value: "319.0" },
            { year: "2025", period: "M06", periodName: "June", value: "310.0" },
          ],
        }],
      },
    }));
  }
  if (href.includes("xlayertestrpc")) {
    return Promise.resolve(ok({ jsonrpc: "2.0", id: 1, result: "0x12d687" }));
  }
  throw new Error("Unexpected URL " + href);
}

test("normalizes credential-free OKX public market data", async () => {
  const market = await fetchOkxMarkets(mockFetch);
  assert.equal(market.items.length, 3);
  assert.equal(market.items[0].instId, "BTC-USDT");
  assert.equal(Number(market.items[0].change24hPct.toFixed(2)), 3.33);
});

test("uses a stable source label when an OKX news item omits its platform", async () => {
  const newsFetch = async () => ok({
    data: {
      articles: [{ id: "1", title: "Headline", summary: "Summary", platform: "", source: "" }],
    },
  });
  const news = await fetchOkxNews({
    OKX_API_KEY: "test-key",
    OKX_API_SECRET: "test-secret",
    OKX_API_PASSPHRASE: "test-passphrase",
  }, newsFetch);
  assert.equal(news.articles[0].source, "OKX News");
});

test("normalizes an official BLS CPI series without inventing consensus", async () => {
  const cpi = await fetchBlsCpi(mockFetch, new Date("2026-08-14T00:00:00Z"));
  assert.equal(cpi.periodName, "June");
  assert.equal(Number(cpi.momPct.toFixed(2)), 0.31);
  assert.equal(Number(cpi.yoyPct.toFixed(2)), 3.23);
  assert.equal("consensus" in cpi, false);
});

test("falls back to the official FRED mirror when the BLS endpoint is blocked", async () => {
  const fallbackFetch = async (url) => {
    if (String(url).includes("api.bls.gov")) return new Response("blocked", { status: 403 });
    if (String(url).includes("fredgraph.csv")) {
      const rows = ["DATE,CPIAUCSL"];
      for (let month = 1; month <= 12; month += 1) {
        rows.push(`2025-${String(month).padStart(2, "0")}-01,${300 + month}`);
      }
      for (let month = 1; month <= 7; month += 1) {
        rows.push(`2026-${String(month).padStart(2, "0")}-01,${312 + month}`);
      }
      return new Response(rows.join("\n"), { status: 200 });
    }
    throw new Error("Unexpected URL " + url);
  };
  const cpi = await fetchBlsCpi(fallbackFetch, new Date("2026-08-14T00:00:00Z"));
  assert.equal(cpi.seriesId, "CPIAUCSL");
  assert.equal(cpi.provider, "Federal Reserve Bank of St. Louis (BLS CPI series)");
  assert.equal(cpi.periodName, "July");
  assert.equal(Number(cpi.yoyPct.toFixed(2)), 3.91);
});

test("builds a bounded bilingual live snapshot from timestamped evidence", async () => {
  const [market, cpi, xlayer] = await Promise.all([
    fetchOkxMarkets(mockFetch),
    fetchBlsCpi(mockFetch, new Date("2026-08-14T00:00:00Z")),
    fetchXLayerStatus(mockFetch),
  ]);
  const snapshot = await buildSnapshot({
    market,
    cpi,
    xlayer,
    news: { configured: false, articles: [] },
    now: 1_786_665_600_000,
  });
  assert.equal(snapshot.schema, "askstone.live-snapshot.v1");
  assert.equal(snapshot.mode, "live");
  assert.ok(snapshot.sources.length >= 5);
  assert.match(snapshot.reasoning[0].hash, /^0x[0-9a-f]{64}$/);
  assert.ok(["trade", "hedge", "wait"].includes(snapshot.recommendedDecision));
  assert.equal(typeof snapshot.event.summary.zh, "string");
  assert.match(snapshot.event.title.zh, /美国 6月 CPI/);
  assert.doesNotMatch(snapshot.event.title.zh, /June/);
  assert.ok(snapshot.warnings.includes("okx_news_credentials_missing"));
});

test("fails safely to deterministic guardrails when no AI secret is configured", async () => {
  const snapshot = { engine: { name: "EventEdge Engine", aiStatus: "unknown" } };
  const result = await maybeEnhanceWithAi({}, snapshot, () => {
    throw new Error("network must not be called");
  });
  assert.equal(result.engine.aiStatus, "not_configured");
});

test("a forced refresh bypasses an otherwise fresh source cache", async () => {
  let loads = 0;
  const key = `force-refresh-${Date.now()}`;
  const loader = async () => ({ generation: ++loads });
  const first = await cachedSource({}, key, 60_000, loader, 1_000);
  const cached = await cachedSource({}, key, 60_000, loader, 2_000);
  const forced = await cachedSource({}, key, 60_000, loader, 3_000, true);
  assert.equal(first.generation, 1);
  assert.equal(cached.generation, 1);
  assert.equal(forced.generation, 2);
});

test("keeps the last successful source explicitly marked stale when an upstream fails", async () => {
  const key = `stale-fallback-${Date.now()}`;
  await cachedSource({}, key, 1_000, async () => ({ value: "verified" }), 1_000);
  const fallback = await cachedSource({}, key, 1_000, async () => {
    throw new Error("rate_limited");
  }, 3_000);
  assert.deepEqual(fallback, { value: "verified", _cacheStale: true });
});

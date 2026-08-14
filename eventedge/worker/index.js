import { maybeEnhanceWithAi } from "./ai.js";
import {
  fetchBlsCpi,
  fetchOkxMarkets,
  fetchOkxNews,
  fetchXLayerStatus,
  verifyXLayerReceipt,
} from "./data-sources.js";
import { buildSnapshot } from "./engine.js";
import {
  cachedSource,
  getRecentSnapshot,
  listReceipts,
  listSnapshots,
  saveReceipt,
  saveSnapshot,
} from "./storage.js";

const LIVE_SNAPSHOT_TTL_MS = 12_000;
const HASH = /^0x[0-9a-f]{64}$/i;
const ADDRESS = /^0x[0-9a-f]{40}$/i;

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function secure(response) {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function settledValue(result, errorCode, errors) {
  if (result.status === "fulfilled") return result.value;
  errors.push(errorCode);
  return null;
}

export async function createLiveSnapshot(env, fetcher = fetch, force = false, now = Date.now()) {
  if (!force) {
    const cached = await getRecentSnapshot(env, LIVE_SNAPSHOT_TTL_MS, now);
    if (cached) return cached;
  }

  const tasks = await Promise.allSettled([
    cachedSource(env, "bls-cpi", 6 * 60 * 60 * 1_000, () => fetchBlsCpi(fetcher), now, force),
    cachedSource(env, "okx-public-market", 15_000, () => fetchOkxMarkets(fetcher), now, force),
    cachedSource(env, "okx-social-news", 60_000, () => fetchOkxNews(env, fetcher), now, force),
    cachedSource(env, "xlayer-testnet-head", 10_000, () => fetchXLayerStatus(fetcher), now, force),
  ]);
  const errors = [];
  const snapshot = await buildSnapshot({
    cpi: settledValue(tasks[0], "bls_unavailable", errors),
    market: settledValue(tasks[1], "okx_market_unavailable", errors),
    news: settledValue(tasks[2], "okx_news_unavailable", errors),
    xlayer: settledValue(tasks[3], "xlayer_rpc_unavailable", errors),
    errors,
    now,
  });
  const enhanced = await maybeEnhanceWithAi(env, snapshot, fetcher);
  await saveSnapshot(env, enhanced);
  return enhanced;
}

function validReceiptPayload(body) {
  return body &&
    ADDRESS.test(body.owner ?? "") &&
    HASH.test(body.receiptId ?? "") &&
    HASH.test(body.eventHash ?? "") &&
    HASH.test(body.planHash ?? "") &&
    HASH.test(body.txHash ?? "") &&
    ["trade", "hedge", "wait"].includes(body.decision) &&
    Number(body.chainId) === 1952;
}

async function handleApi(request, env) {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/live") {
    const force = url.searchParams.get("refresh") === "1";
    return json({ ok: true, data: await createLiveSnapshot(env, fetch, force) });
  }

  if (request.method === "GET" && url.pathname === "/api/stream") {
    const snapshot = await createLiveSnapshot(env);
    const body = [
      "retry: 15000",
      "event: snapshot",
      `data: ${JSON.stringify({ ok: true, data: snapshot })}`,
      "",
      "",
    ].join("\n");
    return new Response(body, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
    });
  }

  if (request.method === "GET" && url.pathname === "/api/history") {
    const limit = Number(url.searchParams.get("limit") ?? 12);
    return json({ ok: true, data: await listSnapshots(env, limit) });
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    const snapshot = await createLiveSnapshot(env);
    return json({
      ok: true,
      data: {
        status: snapshot.sources.length ? "operational" : "degraded",
        generatedAt: snapshot.generatedAt,
        sourceCount: snapshot.sources.length,
        warnings: snapshot.warnings,
        aiStatus: snapshot.engine.aiStatus,
        persistence: Boolean(env?.DB?.prepare),
      },
    });
  }

  if (request.method === "GET" && url.pathname === "/api/config") {
    return json({
      ok: true,
      data: {
        okxPublicMarket: true,
        okxSocialNews: Boolean(env?.OKX_API_KEY && env?.OKX_API_SECRET && env?.OKX_API_PASSPHRASE),
        openAiAnalysis: Boolean(env?.OPENAI_API_KEY),
        xLayerChainId: 1952,
        refreshSeconds: 15,
      },
    });
  }

  if (request.method === "GET" && url.pathname === "/api/receipts") {
    const owner = url.searchParams.get("owner") ?? "";
    if (!ADDRESS.test(owner)) return json({ ok: false, error: "invalid_owner" }, { status: 400 });
    return json({ ok: true, data: await listReceipts(env, owner) });
  }

  if (request.method === "POST" && url.pathname === "/api/receipts") {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 12_000) return json({ ok: false, error: "payload_too_large" }, { status: 413 });
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return json({ ok: false, error: "origin_mismatch" }, { status: 403 });

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    if (!validReceiptPayload(body)) return json({ ok: false, error: "invalid_receipt" }, { status: 400 });

    const verified = await verifyXLayerReceipt(body.txHash, body.owner);
    if (!verified) return json({ ok: false, error: "unverified_transaction" }, { status: 422 });
    const persisted = await saveReceipt(env, {
      ...body,
      chainId: 1952,
      recordedAt: Date.now(),
    });
    return json({ ok: true, data: { persisted } }, { status: persisted ? 201 : 202 });
  }

  if (url.pathname.startsWith("/api/")) {
    return json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return null;
}

export default {
  async fetch(request, env) {
    try {
      const apiResponse = await handleApi(request, env);
      if (apiResponse) return secure(apiResponse);
    } catch {
      if (new URL(request.url).pathname.startsWith("/api/")) {
        return secure(json({ ok: false, error: "service_unavailable" }, { status: 503 }));
      }
    }

    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return secure(response);
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return secure(await env.ASSETS.fetch(new Request(indexUrl, request)));
  },
};

const OKX_REST = "https://www.okx.com";
const OKX_ONCHAIN = "https://web3.okx.com";
const BLS_API = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
const FRED_CPI_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL";
const XLAYER_RPC = "https://xlayertestrpc.okx.com/terigon";
const REGISTRY_ADDRESS = "0x8eb68d8fc210e4da44bb5f6248d102ff44aa7647";

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchJson(fetcher, url, options = {}, timeoutMs = 7_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      ...options,
      signal: controller.signal,
      headers: { accept: "application/json", ...(options.headers ?? {}) },
    });
    if (!response.ok) throw new Error(`upstream_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(fetcher, url, options = {}, timeoutMs = 9_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      ...options,
      signal: controller.signal,
      headers: { accept: "text/csv", ...(options.headers ?? {}) },
    });
    if (!response.ok) throw new Error(`upstream_${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function okxTicker(fetcher, instId) {
  const payload = await fetchJson(
    fetcher,
    `${OKX_REST}/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`,
  );
  if (payload.code !== "0" || !payload.data?.[0]) throw new Error(`okx_${instId}_unavailable`);
  const row = payload.data[0];
  const last = number(row.last);
  const open24h = number(row.open24h);
  return {
    instId,
    last,
    bid: number(row.bidPx),
    ask: number(row.askPx),
    volume24h: number(row.volCcy24h),
    change24hPct: last !== null && open24h ? ((last / open24h) - 1) * 100 : null,
    observedAt: number(row.ts) ?? Date.now(),
  };
}

export async function fetchOkxMarkets(fetcher = fetch) {
  const instruments = ["BTC-USDT", "ETH-USDT", "PAXG-USDT"];
  const settled = await Promise.allSettled(instruments.map((id) => okxTicker(fetcher, id)));
  const items = settled.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  if (!items.length) throw new Error("okx_market_unavailable");
  return { provider: "OKX Public Market Data", items, fetchedAt: Date.now() };
}

function sortBlsRows(rows) {
  return [...rows]
    .filter((row) => /^M(0[1-9]|1[0-2])$/.test(row.period))
    .sort((a, b) => `${b.year}${b.period}`.localeCompare(`${a.year}${a.period}`));
}

async function fetchBlsApiCpi(fetcher, now) {
  const endyear = now.getUTCFullYear();
  const payload = await fetchJson(fetcher, BLS_API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      seriesid: ["CUSR0000SA0"],
      startyear: String(endyear - 2),
      endyear: String(endyear),
    }),
  }, 9_000);
  const rows = sortBlsRows(payload.Results?.series?.[0]?.data ?? []);
  if (rows.length < 2) throw new Error("bls_cpi_unavailable");
  const latest = rows[0];
  const previous = rows[1];
  const yearAgo = rows.find((row) => (
    Number(row.year) === Number(latest.year) - 1 && row.period === latest.period
  ));
  const latestValue = number(latest.value);
  const previousValue = number(previous.value);
  const yearAgoValue = number(yearAgo?.value);
  return {
    provider: "U.S. Bureau of Labor Statistics",
    seriesId: "CUSR0000SA0",
    year: Number(latest.year),
    period: latest.period,
    periodName: latest.periodName,
    indexValue: latestValue,
    previousValue,
    momPct: latestValue !== null && previousValue ? ((latestValue / previousValue) - 1) * 100 : null,
    yoyPct: latestValue !== null && yearAgoValue ? ((latestValue / yearAgoValue) - 1) * 100 : null,
    sourceUrl: "https://www.bls.gov/news.release/cpi.nr0.htm",
    fetchedAt: Date.now(),
  };
}

function parseFredCpi(csv) {
  const rows = csv.trim().split(/\r?\n/).slice(1).flatMap((line) => {
    const [date, rawValue] = line.split(",");
    const value = number(rawValue);
    return /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") && value !== null
      ? [{ date, value }]
      : [];
  });
  if (rows.length < 13) throw new Error("fred_cpi_unavailable");
  rows.sort((a, b) => b.date.localeCompare(a.date));
  const latest = rows[0];
  const previous = rows[1];
  const [year, month] = latest.date.split("-").map(Number);
  const yearAgo = rows.find((row) => row.date.startsWith(`${year - 1}-${String(month).padStart(2, "0")}`));
  return {
    provider: "Federal Reserve Bank of St. Louis (BLS CPI series)",
    seriesId: "CPIAUCSL",
    year,
    period: `M${String(month).padStart(2, "0")}`,
    periodName: new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(
      new Date(Date.UTC(year, month - 1, 1)),
    ),
    indexValue: latest.value,
    previousValue: previous.value,
    momPct: ((latest.value / previous.value) - 1) * 100,
    yoyPct: yearAgo ? ((latest.value / yearAgo.value) - 1) * 100 : null,
    sourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL",
    fetchedAt: Date.now(),
  };
}

export async function fetchBlsCpi(fetcher = fetch, now = new Date()) {
  try {
    return await fetchBlsApiCpi(fetcher, now);
  } catch {
    return parseFredCpi(await fetchText(fetcher, FRED_CPI_CSV));
  }
}

function base64(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function okxSignature(secret, prehash) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64(await crypto.subtle.sign("HMAC", key, encoder.encode(prehash)));
}

export async function fetchOkxNews(env, fetcher = fetch) {
  if (!env?.OKX_API_KEY || !env?.OKX_API_SECRET || !env?.OKX_API_PASSPHRASE) {
    return { configured: false, articles: [], fetchedAt: Date.now() };
  }
  const path = "/api/v6/dex/market/social/news/latest?limit=6&detailLevel=1&language=en_US&tokenSymbols=BTC,ETH";
  const timestamp = new Date().toISOString();
  const signature = await okxSignature(env.OKX_API_SECRET, `${timestamp}GET${path}`);
  const payload = await fetchJson(fetcher, `${OKX_ONCHAIN}${path}`, {
    headers: {
      "OK-ACCESS-KEY": env.OKX_API_KEY,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-PASSPHRASE": env.OKX_API_PASSPHRASE,
      "OK-ACCESS-TIMESTAMP": timestamp,
    },
  });
  const data = payload.data ?? payload;
  return {
    configured: true,
    articles: (data.articles ?? []).slice(0, 6).map((article) => ({
      id: String(article.id),
      title: String(article.title ?? ""),
      summary: String(article.summary ?? ""),
      source: String(article.platform || article.source || "OKX News"),
      sourceUrl: String(article.sourceUrl ?? ""),
      timestamp: number(article.timestamp) ?? Date.now(),
      importance: String(article.importance ?? "medium"),
    })),
    fetchedAt: number(data.ts) ?? Date.now(),
  };
}

export async function fetchXLayerStatus(fetcher = fetch) {
  const payload = await fetchJson(fetcher, XLAYER_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
  });
  if (!/^0x[0-9a-f]+$/i.test(payload.result ?? "")) throw new Error("xlayer_rpc_unavailable");
  return { blockNumber: Number.parseInt(payload.result, 16), fetchedAt: Date.now() };
}

export async function verifyXLayerReceipt(txHash, owner, fetcher = fetch) {
  const payload = await fetchJson(fetcher, XLAYER_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionReceipt",
      params: [txHash],
    }),
  });
  const receipt = payload.result;
  return Boolean(
    receipt &&
    receipt.status === "0x1" &&
    receipt.from?.toLowerCase() === owner.toLowerCase() &&
    receipt.to?.toLowerCase() === REGISTRY_ADDRESS
  );
}

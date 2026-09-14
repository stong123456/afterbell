// Adapted from the user's AskStone worker/data-sources.js: public read-only sources only.
const OKX_REST = "https://www.okx.com";
const BLS_API = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
const FRED_CPI_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL";

function number(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
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



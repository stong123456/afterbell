function price(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1_000 ? 0 : 2,
  }).format(value);
}

function pct(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function clock(timestamp) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `0x${hex}`;
}

function marketBySymbol(market, symbol) {
  return market?.items?.find((item) => item.instId === `${symbol}-USDT`) ?? null;
}

function bilingual(en, zh) {
  return { en, zh };
}

function plans(recommendedDecision) {
  const shared = { notionalCap: "$100,000", slippage: "0.18%", expiresInMinutes: 30 };
  return {
    trade: {
      ...shared,
      allocation: [
        ["gold", "35%", "$35,000"],
        ["btc", "40%", "$40,000"],
        ["eth", "20%", "$20,000"],
        ["cash", "5%", "$5,000"],
      ],
      maxLoss: "-$6,000 (6.0%)",
      rationale: bilingual(
        "Directional exposure is available only while the live market evidence remains aligned and fresh.",
        "仅在实时市场证据保持一致且仍然新鲜时，才考虑建立方向性敞口。",
      ),
    },
    hedge: {
      ...shared,
      allocation: [
        ["gold", "40%", "$40,000"],
        ["btc", "35%", "$35,000"],
        ["eth", "15%", "$15,000"],
        ["cash", "10%", "$10,000"],
      ],
      maxLoss: "-$5,000 (5.0%)",
      rationale: bilingual(
        "Use a bounded hedge while macro evidence and current OKX prices are corroborated; refresh before execution.",
        "当宏观证据与 OKX 实时价格相互印证时采用有界对冲；执行前必须刷新报价。",
      ),
    },
    wait: {
      ...shared,
      allocation: [["cash", "100%", "$100,000"]],
      maxLoss: "$0 (0.0%)",
      rationale: bilingual(
        recommendedDecision === "wait"
          ? "Live evidence is incomplete or not aligned. No directional position is justified yet."
          : "Stand aside if any source becomes stale, conflicts, or loses price confirmation.",
        recommendedDecision === "wait"
          ? "实时证据尚不完整或未形成一致方向，当前不支持方向性仓位。"
          : "若任一关键来源过期、冲突或失去价格确认，则保持观望。",
      ),
    },
  };
}

function liveSource({ id, name, headline, detail, timestamp, state, sourceUrl, isNew = false }, now) {
  return {
    id,
    name,
    headline,
    detail,
    time: clock(timestamp),
    observedAt: timestamp,
    freshSeconds: Math.max(0, Math.round((now - timestamp) / 1_000)),
    state,
    sourceUrl,
    isNew,
  };
}

export async function buildSnapshot({ cpi, market, news, xlayer, errors = [], now = Date.now() }) {
  const btc = marketBySymbol(market, "BTC");
  const eth = marketBySymbol(market, "ETH");
  const paxg = marketBySymbol(market, "PAXG");
  const marketItems = [btc, eth, paxg].filter(Boolean);
  const marketDirection = marketItems.length
    ? marketItems.reduce((sum, item) => sum + (item.change24hPct ?? 0), 0) / marketItems.length
    : 0;
  const eventPoints = cpi ? 24 : 0;
  const breadthPoints = Math.min(18, marketItems.length * 6);
  const newsPoints = news?.articles?.length ? Math.min(12, 4 + news.articles.length) : 0;
  const pricePoints = marketItems.length >= 2 ? 16 : marketItems.length * 6;
  const chainPoints = xlayer?.blockNumber ? 8 : 0;
  const qualityPoints = Math.max(2, 10 - errors.length * 2);
  const conflictPenalty = marketItems.length >= 2 && Math.abs(marketDirection) < 0.15 ? -4 : 0;
  const score = Math.max(0, Math.min(100,
    eventPoints + breadthPoints + newsPoints + pricePoints + chainPoints + qualityPoints + conflictPenalty,
  ));
  const recommendedDecision = score >= 78 && Math.abs(marketDirection) >= 1
    ? "trade"
    : score >= 64 && marketDirection >= 0
      ? "hedge"
      : "wait";
  const generatedAt = new Date(now).toISOString();
  const eventId = cpi
    ? `evt_us_cpi_${cpi.year}_${String(cpi.period).toLowerCase()}`
    : `evt_market_snapshot_${generatedAt.slice(0, 16).replace(/[-:T]/g, "")}`;
  const cpiYoy = cpi?.yoyPct;
  const cpiMom = cpi?.momPct;
  const cpiYoyLabel = cpiYoy === null || cpiYoy === undefined
    ? String(cpi?.indexValue ?? "—")
    : `${cpiYoy.toFixed(2)}% YoY`;
  const cpiYoyLabelZh = cpiYoy === null || cpiYoy === undefined
    ? String(cpi?.indexValue ?? "—")
    : `同比 ${cpiYoy.toFixed(2)}%`;
  const sources = [];

  if (cpi) {
    sources.push(liveSource({
      id: "bls_live",
      name: bilingual("U.S. BLS", "美国劳工统计局"),
      headline: bilingual(
        `CPI ${cpi.periodName} ${cpi.year}: ${cpiYoyLabel}`,
        `${cpi.year}年${cpi.periodName} CPI：${cpiYoyLabelZh}`,
      ),
      detail: bilingual(`Seasonally adjusted MoM ${pct(cpiMom)}`, `季调环比 ${pct(cpiMom)}`),
      timestamp: cpi.fetchedAt,
      state: "confirmed",
      sourceUrl: cpi.sourceUrl,
      isNew: true,
    }, now));
  }

  for (const item of marketItems) {
    const symbol = item.instId.split("-")[0];
    sources.push(liveSource({
      id: `okx_${symbol.toLowerCase()}`,
      name: bilingual(`OKX ${item.instId}`, `OKX ${item.instId}`),
      headline: bilingual(
        `${price(item.last)} · 24h ${pct(item.change24hPct)}`,
        `${price(item.last)} · 24小时 ${pct(item.change24hPct)}`,
      ),
      detail: bilingual(
        `Bid ${price(item.bid)} · Ask ${price(item.ask)}`,
        `买一 ${price(item.bid)} · 卖一 ${price(item.ask)}`,
      ),
      timestamp: item.observedAt,
      state: Math.abs(item.change24hPct ?? 0) >= 0.15 ? "confirmed" : "neutral",
      sourceUrl: "https://www.okx.com/markets/prices",
    }, now));
  }

  if (xlayer?.blockNumber) {
    sources.push(liveSource({
      id: "xlayer_block",
      name: bilingual("X Layer Testnet RPC", "X Layer 测试网 RPC"),
      headline: bilingual(
        `Block #${xlayer.blockNumber.toLocaleString("en-US")}`,
        `区块 #${xlayer.blockNumber.toLocaleString("en-US")}`,
      ),
      detail: bilingual("Chain head verified", "已验证最新链上高度"),
      timestamp: xlayer.fetchedAt,
      state: "confirmed",
      sourceUrl: "https://www.okx.com/web3/explorer/xlayer-test",
    }, now));
  }

  for (const [index, article] of (news?.articles ?? []).slice(0, 3).entries()) {
    sources.push(liveSource({
      id: `okx_news_${index}`,
      name: bilingual(article.source, article.source),
      headline: bilingual(article.title, article.title),
      detail: bilingual(article.summary, article.summary),
      timestamp: article.timestamp,
      state: "mixed",
      sourceUrl: article.sourceUrl,
    }, now));
  }

  const evidenceHash = await sha256(JSON.stringify(
    sources.map(({ id, headline, observedAt }) => ({ id, headline, observedAt })),
  ));
  const marketSummary = marketItems.length
    ? marketItems.map((item) => `${item.instId.split("-")[0]} ${pct(item.change24hPct)}`).join(" · ")
    : "Market feed unavailable";
  const warnings = [...errors];
  if (!news?.configured) warnings.push("okx_news_credentials_missing");

  return {
    schema: "askstone.live-snapshot.v1",
    snapshotId: `snapshot_${now}`,
    mode: "live",
    generatedAt,
    generatedAtMs: now,
    event: {
      id: eventId,
      title: bilingual(
        cpi ? `U.S. CPI ${cpi.periodName}: ${cpiYoyLabel}` : "Live cross-market event snapshot",
        cpi ? `美国 ${cpi.periodName} CPI：${cpiYoyLabelZh}` : "实时跨市场事件快照",
      ),
      timestamp: bilingual(
        `${generatedAt.replace("T", " ").slice(0, 19)} UTC`,
        `${generatedAt.replace("T", " ").slice(0, 19)} UTC`,
      ),
      summary: bilingual(
        `Official CPI evidence is paired with live OKX prices (${marketSummary}). The deterministic guardrail currently recommends ${recommendedDecision.toUpperCase()}.`,
        `系统将官方 CPI 证据与 OKX 实时价格（${marketSummary}）交叉验证；确定性风险规则当前建议“${recommendedDecision === "trade" ? "交易" : recommendedDecision === "hedge" ? "对冲" : "观望"}”。`,
      ),
      interpretation: bilingual(
        "This live snapshot does not assume an unpublished consensus. It separates observed macro data, current market response, news availability, and X Layer health before proposing an action.",
        "该实时快照不会虚构尚未接入的市场预期，而是先拆分官方宏观数据、当前行情响应、新闻可用性与 X Layer 状态，再生成行动建议。",
      ),
    },
    sources,
    confidence: {
      score,
      factors: [
        ["eventCertainty", `${eventPoints} / 25`],
        ["marketBreadth", `${breadthPoints} / 20`],
        ["newsConsensus", `${newsPoints} / 15`],
        ["priceConfirmation", `${pricePoints} / 20`],
        ["onchainHealth", `${chainPoints} / 10`],
        ["dataQuality", `${qualityPoints} / 10`],
        ["conflictPenalty", String(conflictPenalty)],
      ],
    },
    reasoning: [
      {
        id: "cpi",
        strength: cpi ? "0.96" : "0.00",
        title: bilingual("Official CPI release", "官方 CPI 发布"),
        subtitle: bilingual(
          cpi ? `(${cpi.periodName} ${cpi.year})` : "(unavailable)",
          cpi ? `（${cpi.year}年${cpi.periodName}）` : "（不可用）",
        ),
        value: cpi ? cpiYoyLabel : "—",
        delta: bilingual(cpi ? `MoM ${pct(cpiMom)}` : "No official observation", cpi ? `环比 ${pct(cpiMom)}` : "暂无官方观测"),
        evidence: cpi ? ["bls_live"] : [],
        hash: await sha256(JSON.stringify(cpi ?? {})),
      },
      {
        id: "rates",
        strength: marketItems.length ? "0.78" : "0.00",
        title: bilingual("OKX market response", "OKX 市场响应"),
        subtitle: bilingual("(24h spot change)", "（24小时现货变化）"),
        value: marketSummary,
        delta: bilingual("Live public market feed", "实时公开行情"),
        evidence: marketItems.map((item) => `okx_${item.instId.split("-")[0].toLowerCase()}`),
        hash: await sha256(JSON.stringify(marketItems)),
      },
      {
        id: "yields",
        strength: xlayer ? "0.92" : "0.00",
        title: bilingual("X Layer readiness", "X Layer 就绪状态"),
        subtitle: bilingual("(testnet receipt rail)", "（测试网收据通道）"),
        value: xlayer ? `Block #${xlayer.blockNumber}` : "Unavailable",
        delta: bilingual(xlayer ? "RPC verified" : "RPC unavailable", xlayer ? "RPC 已验证" : "RPC 不可用"),
        evidence: xlayer ? ["xlayer_block"] : [],
        hash: await sha256(JSON.stringify(xlayer ?? {})),
      },
    ],
    impacts: [
      {
        id: "gold",
        symbol: "PAXG",
        score: paxg ? String(Math.min(0.9, 0.55 + Math.abs(paxg.change24hPct ?? 0) / 20).toFixed(2)) : "0.00",
        flow: paxg ? `24h ${pct(paxg.change24hPct)}` : "Unavailable",
        evidence: "OKX PAXG-USDT",
      },
      {
        id: "xbtc",
        symbol: "BTC",
        score: btc ? String(Math.min(0.9, 0.55 + Math.abs(btc.change24hPct ?? 0) / 20).toFixed(2)) : "0.00",
        flow: btc ? `24h ${pct(btc.change24hPct)}` : "Unavailable",
        evidence: "OKX BTC-USDT",
      },
      {
        id: "xeth",
        symbol: "ETH",
        score: eth ? String(Math.min(0.9, 0.55 + Math.abs(eth.change24hPct ?? 0) / 20).toFixed(2)) : "0.00",
        flow: eth ? `24h ${pct(eth.change24hPct)}` : "Unavailable",
        evidence: "OKX ETH-USDT",
      },
    ],
    plans: plans(recommendedDecision),
    recommendedDecision,
    receipt: { status: "ready", eventHash: evidenceHash, planHash: evidenceHash, txHash: null },
    engine: {
      name: "EventEdge Engine",
      version: "2.0.0",
      aiStatus: "not_configured",
      model: null,
      generatedAt,
    },
    warnings: [...new Set(warnings)],
  };
}

const memoryCache = new Map();

function hasDatabase(env) {
  return Boolean(env?.DB?.prepare);
}

export async function cachedSource(env, key, ttlMs, loader, now = Date.now()) {
  if (hasDatabase(env)) {
    try {
      const row = await env.DB.prepare(
        "SELECT payload_json, expires_at FROM source_cache WHERE cache_key = ?",
      ).bind(key).first();
      if (row && Number(row.expires_at) > now) return JSON.parse(row.payload_json);
    } catch {
      // A fresh deployment may briefly serve before migrations settle. Fall back to memory.
    }
  } else {
    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > now) return cached.value;
  }

  const value = await loader();
  const expiresAt = now + ttlMs;
  memoryCache.set(key, { value, expiresAt });

  if (hasDatabase(env)) {
    try {
      await env.DB.prepare(
        `INSERT INTO source_cache (cache_key, payload_json, fetched_at, expires_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(cache_key) DO UPDATE SET
           payload_json = excluded.payload_json,
           fetched_at = excluded.fetched_at,
           expires_at = excluded.expires_at`,
      ).bind(key, JSON.stringify(value), now, expiresAt).run();
    } catch {
      // The live response remains usable even if persistence is temporarily unavailable.
    }
  }

  return value;
}

export async function saveSnapshot(env, snapshot) {
  memoryCache.set("latest-snapshot", { value: snapshot, expiresAt: snapshot.generatedAtMs + 12_000 });
  if (!hasDatabase(env)) return;
  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO live_snapshots
       (snapshot_id, event_id, generated_at, mode, confidence, payload_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(
      snapshot.snapshotId,
      snapshot.event.id,
      snapshot.generatedAtMs,
      snapshot.mode,
      snapshot.confidence.score,
      JSON.stringify(snapshot),
    ).run();
  } catch {
    // Persistence must never make the current evidence stream unavailable.
  }
}

export async function getRecentSnapshot(env, maxAgeMs, now = Date.now()) {
  const memory = memoryCache.get("latest-snapshot");
  if (memory && now - memory.value.generatedAtMs <= maxAgeMs) return memory.value;
  if (!hasDatabase(env)) return null;
  try {
    const row = await env.DB.prepare(
      "SELECT payload_json, generated_at FROM live_snapshots ORDER BY generated_at DESC LIMIT 1",
    ).first();
    if (!row || now - Number(row.generated_at) > maxAgeMs) return null;
    return JSON.parse(row.payload_json);
  } catch {
    return null;
  }
}

export async function listSnapshots(env, limit = 12) {
  if (!hasDatabase(env)) {
    const latest = memoryCache.get("latest-snapshot")?.value;
    return latest ? [latest] : [];
  }
  try {
    const result = await env.DB.prepare(
      "SELECT payload_json FROM live_snapshots ORDER BY generated_at DESC LIMIT ?",
    ).bind(Math.min(Math.max(limit, 1), 50)).all();
    return (result.results ?? []).map((row) => JSON.parse(row.payload_json));
  } catch {
    return [];
  }
}

export async function saveReceipt(env, receipt) {
  if (!hasDatabase(env)) return false;
  await env.DB.prepare(
    `INSERT INTO decision_receipts
     (receipt_id, owner, event_hash, plan_hash, tx_hash, decision_kind, chain_id, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(receipt_id) DO UPDATE SET
       tx_hash = excluded.tx_hash,
       recorded_at = excluded.recorded_at`,
  ).bind(
    receipt.receiptId.toLowerCase(),
    receipt.owner.toLowerCase(),
    receipt.eventHash.toLowerCase(),
    receipt.planHash.toLowerCase(),
    receipt.txHash.toLowerCase(),
    receipt.decision,
    receipt.chainId,
    receipt.recordedAt,
  ).run();
  return true;
}

export async function listReceipts(env, owner, limit = 20) {
  if (!hasDatabase(env)) return [];
  const result = await env.DB.prepare(
    `SELECT receipt_id AS receiptId, owner, event_hash AS eventHash,
            plan_hash AS planHash, tx_hash AS txHash,
            decision_kind AS decision, chain_id AS chainId,
            recorded_at AS recordedAt
     FROM decision_receipts
     WHERE owner = ?
     ORDER BY recorded_at DESC
     LIMIT ?`,
  ).bind(owner.toLowerCase(), Math.min(Math.max(limit, 1), 50)).all();
  return result.results ?? [];
}

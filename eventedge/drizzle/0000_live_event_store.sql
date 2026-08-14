CREATE TABLE IF NOT EXISTS live_snapshots (
  snapshot_id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL,
  generated_at INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('live', 'replay')),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_live_snapshots_generated_at
ON live_snapshots(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_snapshots_event_generated
ON live_snapshots(event_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS source_cache (
  cache_key TEXT PRIMARY KEY NOT NULL,
  payload_json TEXT NOT NULL,
  fetched_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_source_cache_expires_at
ON source_cache(expires_at);

CREATE TABLE IF NOT EXISTS decision_receipts (
  receipt_id TEXT PRIMARY KEY NOT NULL,
  owner TEXT NOT NULL,
  event_hash TEXT NOT NULL,
  plan_hash TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  decision_kind TEXT NOT NULL CHECK (decision_kind IN ('trade', 'hedge', 'wait')),
  chain_id INTEGER NOT NULL CHECK (chain_id = 1952),
  recorded_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_decision_receipts_owner_recorded
ON decision_receipts(owner, recorded_at DESC);

PRAGMA optimize;

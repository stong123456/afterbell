const LIVE_SCHEMA = "askstone.live-snapshot.v1";

function jsonHeaders() {
  return { accept: "application/json", "content-type": "application/json" };
}

export function isLiveSnapshot(value) {
  return value?.schema === LIVE_SCHEMA &&
    value.mode === "live" &&
    typeof value.generatedAt === "string" &&
    typeof value.event?.id === "string" &&
    Array.isArray(value.sources) &&
    Number.isInteger(value.confidence?.score) &&
    value.confidence.score >= 0 &&
    value.confidence.score <= 100 &&
    Array.isArray(value.reasoning) &&
    Array.isArray(value.impacts) &&
    ["trade", "hedge", "wait"].includes(value.recommendedDecision);
}

export function localized(value, locale, fallback = "") {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return fallback;
  return value[locale] ?? value.en ?? value.zh ?? fallback;
}

async function readJson(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) throw new Error(payload?.error ?? `http_${response.status}`);
  return payload.data;
}

export async function fetchLiveSnapshot({ refresh = false, signal } = {}) {
  const response = await fetch(`/api/live${refresh ? "?refresh=1" : ""}`, {
    headers: { accept: "application/json" },
    signal,
  });
  const snapshot = await readJson(response);
  if (!isLiveSnapshot(snapshot)) throw new Error("invalid_live_snapshot");
  return snapshot;
}

export function subscribeToLiveSnapshots({ onSnapshot, onError }) {
  if (typeof EventSource === "undefined") return () => {};
  const stream = new EventSource("/api/stream");
  const handleSnapshot = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (!payload?.ok || !isLiveSnapshot(payload.data)) throw new Error("invalid_stream_snapshot");
      onSnapshot(payload.data);
    } catch (error) {
      onError?.(error);
    }
  };
  stream.addEventListener("snapshot", handleSnapshot);
  stream.onerror = () => onError?.(new Error("live_stream_reconnecting"));
  return () => {
    stream.removeEventListener("snapshot", handleSnapshot);
    stream.close();
  };
}

export async function syncDecisionReceipt(receipt) {
  const response = await fetch("/api/receipts", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(receipt),
  });
  return readJson(response);
}

export async function fetchReceiptHistory(owner, { signal } = {}) {
  const response = await fetch(`/api/receipts?owner=${encodeURIComponent(owner)}`, {
    headers: { accept: "application/json" },
    signal,
  });
  const receipts = await readJson(response);
  return Array.isArray(receipts) ? receipts : [];
}

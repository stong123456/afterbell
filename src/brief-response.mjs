export async function readBriefResponse(response, onEvidence = () => {}) {
  if (!response.headers.get('content-type')?.includes('application/x-ndjson')) {
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'REQUEST_FAILED');
    return data;
  }
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let pending = '', result;
  function consume(line) {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === 'evidence') onEvidence(event);
    if (event.type === 'error') throw Error(event.error || 'REQUEST_FAILED');
    if (event.type === 'result') result = event.data;
  }
  try {
    for (;;) {
      const {done,value} = await reader.read();
      pending += decoder.decode(value, {stream:!done});
      const lines = pending.split('\n'); pending = lines.pop();
      for (const line of lines) consume(line);
      if (pending.length > 1000000) throw Error('RESPONSE_TOO_LARGE');
      if (done) break;
    }
    consume(pending);
    if (!result) throw Error('MODEL_STREAM_INTERRUPTED');
    return result;
  } finally { await reader.cancel().catch(()=>{}); reader.releaseLock(); }
}

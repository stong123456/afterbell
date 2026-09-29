// Keep evidence usable even when the subsequent model request fails.
export function briefStream(run, release = () => {}) {
  let closed = false;
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const emit = value => { if (!closed) controller.enqueue(encoder.encode(JSON.stringify(value) + '\n')); };
      try {
        emit({type:'stage', stage:'retrieving'});
        const data = await run(emit);
        emit({type:'result', data});
      } catch (e) {
        emit({type:'error', error:/^[A-Z_0-9]+$/.test(e.message) ? e.message : 'REQUEST_FAILED'});
      } finally {
        release();
        if (!closed) { closed = true; controller.close(); }
      }
    },
    cancel() { closed = true; }
  });
  return new Response(body, {headers:{'content-type':'application/x-ndjson; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
}

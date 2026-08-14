import worker from "../worker/index.js";

function readBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(chunks.length ? Buffer.concat(chunks) : undefined));
    request.on("error", reject);
  });
}

export function liveApiPlugin() {
  return {
    name: "askstone-live-api",
    configureServer(server) {
      server.middlewares.use(async (incoming, outgoing, next) => {
        if (!incoming.url?.startsWith("/api/")) {
          next();
          return;
        }
        try {
          const body = await readBody(incoming);
          const request = new Request("http://127.0.0.1" + incoming.url, {
            method: incoming.method,
            headers: incoming.headers,
            body,
            duplex: body ? "half" : undefined,
          });
          const response = await worker.fetch(request, {
            OKX_API_KEY: process.env.OKX_API_KEY,
            OKX_API_SECRET: process.env.OKX_API_SECRET,
            OKX_API_PASSPHRASE: process.env.OKX_API_PASSPHRASE,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            OPENAI_MODEL: process.env.OPENAI_MODEL,
            ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
          });
          outgoing.statusCode = response.status;
          for (const [key, value] of response.headers) outgoing.setHeader(key, value);
          outgoing.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

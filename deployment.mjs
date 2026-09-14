export function deploymentConfig(env = process.env) {
  const port = Number(env.PORT || 4318);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('INVALID_PORT');
  const origins = new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`]);
  for (const value of (env.PUBLIC_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean)) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.origin !== value) throw Error('INVALID_PUBLIC_ORIGIN');
    origins.add(url.origin);
  }
  const hosts = new Set([...origins].map(value => new URL(value).host));
  return {port, bind: env.BIND_ADDRESS || '127.0.0.1', origins, hosts};
}

export function requestAllowed(headers, config) {
  if (!config.hosts.has(headers.host)) return false;
  if (!headers.origin) return true;
  try {
    return config.origins.has(headers.origin) && new URL(headers.origin).host === headers.host;
  } catch { return false; }
}

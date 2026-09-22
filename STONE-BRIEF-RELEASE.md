# Stone Brief interaction release

The primary path is now Ask Stone -> Stone Brief -> Challenge -> Remember. Navigation exposes Ask Stone, Memory and Markets. Themes, market browsing, source health, evidence research and old journals/capsules remain available through settings, evidence and memory.

`POST /api/brief` takes one idea, resolves known company aliases (asks for a ticker when needed), gathers up to eight related publisher records and a fresh Bitget token quote, and uses the configured model to return a skeptical, citation-validated brief. It does not require choosing a news event. BYOK remains in Settings. Unconfigured AI produces an explicitly labelled source brief; a Challenge request fails clearly instead of silently substituting rules. Original articles are not fetched in full, and rolling 24-hour price changes are never labelled event-window effects.

## Hosted demo activation
The public worker only accepts a dedicated `ASKSTONE_DEMO_QWEN_KEY` for the hosted demo. Old DASHSCOPE/OPENAI credentials remain ignored. Set secret in Sites, optionally set `ASKSTONE_DEMO_QWEN_REGION=intl` for Singapore (default Beijing), and redeploy. Optional model `ASKSTONE_DEMO_QWEN_MODEL`, default qwen-plus. No key was present during this release.

Every demo model attempt reserves D1 quota: 5 per IP per UTC day, 100 globally per UTC day; failed attempts count. Daily salted hashes replace raw IPs in stored counters, which expire after 2 days. Reservations use conditional atomic upserts, and requests fail closed if DB or trusted Cloudflare IP is unavailable. Maximum model output is 1800 tokens; model timeout is 45 seconds. Two concurrent requests per worker isolate is a secondary control, not a global concurrency guarantee.

## Verified / not yet verified
42 tests passed: alias extraction, malformed inputs, dedicated-key isolation, quota bounds, no fake AI fallback, existing source/market/BYOK protections. Local browser verified one-click NVDA source brief, source disclosure, one-click memory save and Memory navigation. No live Qwen demo request was possible without a key. AI-generated assumptions remain suggestions/unverified until reviewed. This original release did not implement automated review. The subsequent on-demand assumption review is documented in MEMORY-REVIEW-RELEASE.md; background monitoring and automatic changes to human-confirmed statuses remain out of scope.

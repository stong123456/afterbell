# AfterBell 0.2 — research workflow iteration

## What changed
- Compact dark research layout with readable event typography and clearer form hierarchy. Removed nested scrolling from the event feed; six items initially and a show-more control.
- Search by keyword/ticker, asset and publication window. Focus the StoneDaily feed on tracked equities and relevant US macro/geopolitical/energy headlines, preserving original source language and timestamps.
- News and market results render independently. Server request coalescing avoids duplicate simultaneous upstream requests.
- No default scenario beside real news. A selected event is required; switching feed modes clears it. Editing the thesis invalidates the displayed report. Late results cannot overwrite a newer research state.
- Explicit local report saving, bounded to 30 records with schema validation. Reload/open/remove workflow; no silent cloud sync. Download, clipboard and visible Markdown text options.
- Evidence packets retain event title, source URL, publication time and retrieved summary scope. Already-loaded relevant rToken quotes may be included as separate aggregated snapshots, explicitly not equity closes or exchange trade timestamps.
- Qwen server integration using JSON output. Server-only configuration, timeout, output size limits, concurrent-call bound, strict schema and citation-ID validation. No silent fallback from failed AI output to rules.

## Model setup
Copy `.env.example` to `.env`, set `DASHSCOPE_API_KEY`, set `QWEN_BASE_URL` to match the Alibaba Cloud region, and optionally set `QWEN_MODEL` (default `qwen-plus`). Restart the Node server. The `.env` file is ignored by Git. The browser only receives configured/not-configured status, never the credential.

Qwen mode transmits the submitted thesis and selected public evidence to Alibaba Cloud. It does not transmit local journal entries or positions. The app is bound to loopback and checks Host/Origin; public deployment still requires an authentication/rate/budget policy appropriate to that deployment.

Reference: https://www.alibabacloud.com/help/tc/model-studio/user-guide/json-mode and https://help.aliyun.com/en/model-studio/qwen-api-via-openai-chat-completions . API/model availability must be verified against the configured account and region.

## Validation
10 automated tests passed, including fabricated citation rejection, request shape/error handling with a mocked provider, combined freshness/search filtering and corrupt journal data. Production build passed. A live-source rule report returned E1 source + E2 market-snapshot (HTTP 200). Browser clipboard export reported success; file-download event support in the in-app browser remains unverified.

Browser: scenario search → challenge → explicit save → journal → reload → open report passed. A real NVDA news item produced a report retaining its source URL. Chinese/English model setup and mobile 390×844 were checked; document width 375 <= viewport 390. No full accessibility certification is claimed.

Initial audit: large hero occupied the first viewport; real feed had an unrelated default scenario; no search or saved research; feeds waited on each other. Before capture: design/audit-before.png. Targeted repairs preserve the existing navy/lime visual language.

## Remaining boundaries
No API key was configured during this iteration. Qwen success was therefore **not** exercised against the real service. Missing-key path returned 503 QWEN_NOT_CONFIGURED; HTTP 401 was tested with a mocked provider. Schema and reference validation do not establish factual correctness.

This remains a developing research product: no calibrated gap model, historical analogue database, real equity closing-price baseline, trading calendar or public production deployment. Headlines/summaries are not full-document retrieval. Do not describe it as a validated trading predictor or as production-ready.

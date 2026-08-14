# askstone

**askstone** is an AI Event-to-Trade Agent for X Layer, available at `askstone.xyz`. It turns a timestamped real-world event into an evidence-backed causal graph, a bounded Trade/Hedge/Wait decision, and a user-approved onchain receipt. The causal reasoning core is named **EventEdge Engine**.

## What is implemented

- Production-quality desktop Event Workbench with responsive mobile continuation.
- Live evidence aggregation from credential-free OKX public tickers, the official BLS/FRED CPI series, and X Layer testnet RPC.
- Optional signed OKX Onchain news ingestion and OpenAI structured reasoning, with honest configuration/degraded states.
- D1-backed snapshot cache, receipt index, health endpoint, and automatic server-sent live refresh.
- Deterministic CPI replay with timestamped evidence arrival for a network-independent demo.
- Decomposed confidence score and expandable reasoning evidence.
- Interactive Trade, Hedge, and Wait plans.
- Chinese-first onboarding with a persistent English/Chinese switch.
- Transparent verified-demo labeling, functional replay speed/filter controls, and copyable receipt evidence.
- Wallet review with live EIP-1193 approval and X Layer Testnet submission.
- X Layer receipt state with event, plan, and execution hashes.
- Audited non-custodial `EventDecisionRegistry`, reproducible compiler artifact, and X Layer testnet deployment.
- Live EIP-1193 wallet flow that switches/adds X Layer Testnet and records the reviewed receipt onchain.
- Sites-ready Vite build.

Live mode is the default. When an upstream is unavailable before the first valid snapshot, the client explicitly
switches to the labeled replay instead of presenting fixture data as live. Wallet review is live: an injected
EIP-1193 wallet is switched to X Layer testnet and submits the approved receipt to the deployed registry. The
receipt index accepts a record only after verifying the successful transaction, sender, and registry address against
the X Layer testnet RPC.

## Live data configuration

Copy `.env.example` to `.env` for local development. No secret is required for OKX CEX market tickers, CPI,
X Layer status, replay, or onchain receipt recording. Add the three `OKX_API_*` values to activate signed OKX
Onchain latest-news ingestion. Add `OPENAI_API_KEY` to activate strict-schema AI explanations; transaction bounds,
confidence arithmetic, and the final Trade/Hedge/Wait guardrail remain deterministic.

Runtime endpoints:

- `GET /api/live` returns the latest normalized decision snapshot.
- `GET /api/stream` emits snapshots through Server-Sent Events and reconnects automatically.
- `GET /api/health` reports freshness and which optional integrations are configured.
- `GET|POST /api/receipts` indexes only RPC-verified X Layer receipts.

## X Layer testnet deployment

- Contract: `0x8EB68D8fc210e4dA44bb5f6248D102ff44Aa7647`
- Deployment transaction: `0xfbe8a6d270100ac9bea975c22c71a856d7bf8b5047661d98912239dc9a8bde2a`
- Deployment manifest: `deployments/xlayer-testnet.json`
- Security model and limitations: `SECURITY.md`

## Local development

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

## Verification

```bash
npm run build
npm run test:sites
npm run test:live
npm run test:xlayer
npm run contracts:audit
npm run xlayer:testnet:verify
```

## Product and design references

- Product and system architecture: `PRODUCT_ARCHITECTURE.md`
- Accepted visual specification: `design/eventedge-workbench-spec.png`
- Visual QA report: `design-qa.md`
- Contract: `contracts/EventDecisionRegistry.sol`

## Remaining mainnet gates

1. Verify the supported X Layer RWA asset inventory and executable liquidity routes.
2. Complete an independent audit before adding a separately isolated execution adapter.
3. Confirm OKX DEX attribution rules before designing any launch-volume incentive flow.
4. Deploy the registry to mainnet only after source verification and final operational review.

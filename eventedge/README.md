# askstone

**askstone** is an AI Event-to-Trade Agent for X Layer, available at `askstone.xyz`. It turns a timestamped real-world event into an evidence-backed causal graph, a bounded Trade/Hedge/Wait decision, and a user-approved onchain receipt. The causal reasoning core is named **EventEdge Engine**.

## What is implemented

- Production-quality desktop Event Workbench with responsive mobile continuation.
- Deterministic CPI replay with timestamped evidence arrival.
- Decomposed confidence score and expandable reasoning evidence.
- Interactive Trade, Hedge, and Wait plans.
- Wallet review with live EIP-1193 approval and X Layer Testnet submission.
- X Layer receipt state with event, plan, and execution hashes.
- Audited non-custodial `EventDecisionRegistry`, reproducible compiler artifact, and X Layer testnet deployment.
- Live EIP-1193 wallet flow that switches/adds X Layer Testnet and records the reviewed receipt onchain.
- Sites-ready Vite build.

The frontend currently uses a deterministic replay fixture for evidence. Wallet review is live: an injected EIP-1193
wallet is switched to X Layer testnet and submits the approved receipt to the deployed registry.

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
npm run test:xlayer
npm run contracts:audit
npm run xlayer:testnet:verify
```

## Product and design references

- Product and system architecture: `PRODUCT_ARCHITECTURE.md`
- Accepted visual specification: `design/eventedge-workbench-spec.png`
- Visual QA report: `design-qa.md`
- Contract: `contracts/EventDecisionRegistry.sol`

## Integration sequence

1. Replace replay fixtures with validated event and market adapters.
2. Add JSON-schema validation between every agent stage.
3. Verify the supported X Layer RWA asset inventory and liquidity routes.
4. Replace the deterministic replay with validated live event ingestion.
5. Add a separately audited execution adapter after OKX DEX attribution rules are confirmed.

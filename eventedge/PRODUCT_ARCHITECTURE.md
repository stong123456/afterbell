# askstone Product Architecture

## Product thesis

askstone converts a real-world event into a bounded, inspectable, user-approved onchain decision. The product is not a signal dashboard and does not promise autonomous profit. Its durable advantage is the provenance chain between source evidence, causal reasoning, risk boundaries, user consent, and an X Layer receipt.

Brand architecture: **askstone** is the user-facing product and agent at `askstone.xyz`; **EventEdge Engine** is its causal reasoning and decision-generation core.

North-star question: **Can a user understand why an action is proposed, what invalidates it, and exactly what they are signing within 90 seconds of an event?**

## Product architecture

The experience has five layers. Every layer must remain visible in the demo and addressable in code.

1. **Event layer** — normalize scheduled releases such as CPI, FOMC, and NFP into a typed event with actual, consensus, prior, surprise, source, and release time.
2. **Evidence layer** — attach prediction repricing, professional news, cross-asset price response, and X Layer/onchain flows. Every observation carries source, timestamp, freshness, and agreement state.
3. **Reasoning layer** — build a causal graph rather than a prose-only answer. Nodes and edges store their evidence references, confidence contribution, and contradiction flags.
4. **Decision layer** — generate Trade, Hedge, and Wait plans. Each plan includes exposure, notional cap, expected slippage, maximum loss, expiry, and a machine-testable invalidation condition.
5. **Receipt layer** — hash the event snapshot and decision plan, require the user signature, and record the receipt on X Layer. Execution is handled by a separate whitelisted adapter so the audit registry never holds user funds.

## Core user journey

```text
Detected -> Normalized -> Corroborating -> Decision ready
    -> Human review -> Signed -> Executed or Expired -> Receipt
```

The important product decision is that **Wait is a first-class outcome**. A model that always recommends a trade is not a decision engine; it is a content generator with hidden risk.

## Primary screen information architecture

- **Left rail:** product navigation, X Layer environment, wallet boundary.
- **Source stream:** chronological proof of what arrived and when.
- **Reasoning canvas:** event interpretation, decomposed confidence, causal graph, model version, and freshness.
- **Decision inspector:** a fixed comparison point for Trade/Hedge/Wait, risk limits, and invalidation.
- **Review sheet:** the consent boundary immediately before signing.
- **Receipt preview:** event hash, plan hash, network, relayer, and eventual execution hash.

The screen intentionally avoids KPI tiles, generic charts, chat history, and feature navigation that do not help the user make the current decision.

## Agent workflow

| Stage | Input | Deterministic output | AI responsibility |
| --- | --- | --- | --- |
| Normalize | Raw event payloads | `EventSnapshot` | Resolve entities, units, surprise, and time |
| Retrieve | Snapshot and asset universe | `EvidenceItem[]` | Query selection and source prioritization |
| Corroborate | Timestamped evidence | `EvidenceAssessment[]` | Agreement, conflict, and staleness classification |
| Map | Event plus assessments | `CausalGraph` | Cross-asset causal hypotheses with evidence references |
| Score | Graph and data quality | `ConfidenceBreakdown` | Explain contributions; arithmetic is deterministic |
| Plan | Graph, user limits, liquidity | `DecisionPlan[]` | Produce Trade/Hedge/Wait candidates |
| Guard | Selected plan | `ValidatedPlan` | Hard checks run outside the model |
| Attest | Validated hashes and signature | `DecisionReceipt` | No AI discretion; contract writes exact hashes |

## Confidence model

The score is a displayed sum, not a hidden model opinion:

```text
Event certainty          0..25
Probability repricing   0..20
News consensus          0..15
Price confirmation      0..20
Onchain flows           0..10
Data quality            0..10
Conflict penalty       -0..20
--------------------------------
Total                    0..100
```

Release confidence and action confidence should eventually be separated. The first describes whether the event interpretation is correct; the second describes whether current price/liquidity still offers a valid trade.

## System boundaries

```text
Public/event feeds       Market/probability feeds       X Layer Data API
         \                         |                          /
                      Ingestion + timestamping
                                 |
                    askstone Agent Orchestrator
      normalize -> corroborate -> map -> score -> propose
                        EventEdge Engine
                                 |
                   Deterministic Risk Guardrail
                                 |
             React client -> wallet review/signature
                                 |
        Decision Registry (X Layer) + Execution Adapter
                                 |
                 receipt indexer + product timeline
```

### Frontend

- React/Vite desktop-first application.
- Local replay fixture is mandatory so the demo does not depend on a live macro release.
- Rendering consumes structured JSON only; model prose never directly controls transaction parameters.
- The selected plan is editable before signing and has an explicit expiry.

### Agent service

- Cloudflare Worker orchestrator with a D1-backed snapshot cache and receipt index.
- Source adapters execute in parallel and return timestamped, normalized observations from OKX public market data,
  BLS/FRED CPI, X Layer testnet RPC, and optional signed OKX Onchain news.
- The model may generate hypotheses and explanations; scoring arithmetic and risk limits are deterministic functions.
- Each output includes `modelVersion`, `promptVersion`, `sourceIds`, and `generatedAt`.
- Live snapshots are available over REST and one-shot Server-Sent Events; replay remains a labeled, network-independent fallback.

### X Layer contracts

- `EventDecisionRegistry` records event/plan hashes and status; it never takes custody.
- `ExecutionAdapter` is a later, separately audited integration with an allowlisted router and tokens.
- Mainnet execution remains explicitly user-signed. Relaying gas does not imply delegated trading authority.

## Domain contracts

```ts
type EventSnapshot = {
  eventId: string
  kind: "CPI" | "FOMC" | "NFP"
  releasedAt: string
  actual: number
  consensus: number
  prior: number
  surprise: number
  sourceId: string
  sourceHash: `0x${string}`
}

type EvidenceItem = {
  id: string
  source: string
  observedAt: string
  ingestedAt: string
  freshnessMs: number
  stance: "supports" | "contradicts" | "neutral" | "mixed"
  value: unknown
  contentHash: `0x${string}`
}

type DecisionPlan = {
  kind: "trade" | "hedge" | "wait"
  allocations: Array<{ asset: string; weightBps: number }>
  notionalCap: string
  maxLossBps: number
  maxSlippageBps: number
  expiresAt: string
  invalidationRule: string
  evidenceIds: string[]
}
```

## Critical failure states

- **Stale source:** freeze the plan and show the exact stale dependency.
- **Conflicting event values:** stop scoring until the canonical release is resolved.
- **Insufficient liquidity:** downgrade Trade/Hedge to Wait; never hide unavailable execution.
- **Unsupported RWA:** keep it analysis-only and label it clearly.
- **Wallet/network mismatch:** preserve the reviewed plan but block signing.
- **Quote expired:** require a new quote and new plan hash.
- **Model or schema failure:** fall back to evidence view; do not emit a transaction.
- **Contract write failure:** keep the signed payload locally and clearly show that it is not yet attested.

## Competition-complete scope

### Submission build

- Live OKX/BLS-FRED/X Layer aggregation plus a labeled CPI replay fallback.
- Decomposed evidence and causal graph.
- Trade/Hedge/Wait plan comparison.
- Wallet review and X Layer testnet receipt.
- RPC-verified receipt history and D1 persistence.
- Project X account, demo video, and official submission post.

### Post-submission mainnet path

- Verified supported RWA inventory and liquidity routes.
- OKX DEX attribution clarification before any launch-volume architecture is locked.
- Mainnet registry deployment and audited execution adapter.
- No artificial volume or hidden auto-execution.

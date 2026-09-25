# AskStone

**AI Thesis OS for tokenized equities**

Tell AskStone why you want the trade. It turns your idea into falsifiable assumptions, challenges them with evidence, remembers the original thesis, and shows what changed later.

**Remember why. See what changed.**

[Open the demo](https://askstone-eventedge.chunmingyang8.chatgpt.site/) · [Product](docs/PRODUCT.md) · [Submission and demo script](docs/SUBMISSION.md) · [CI](https://github.com/stong123456/afterbell/actions)

```text
Ask Stone → Stone Brief → Challenge → Remember → What Changed
```

## What it does

- **Stone Brief:** one trade idea, a source-backed research brief, and 2–4 falsifiable assumptions with invalidation conditions and monitoring search terms.
- **Challenge:** examines the opposing case while preserving the first Brief's idea, assumptions and timestamp.
- **Remember:** stores the baseline in your browser. Advanced manual audit stays behind a secondary action.
- **What Changed:** retrieves evidence published after the previous check, selects sources against each assumption, and explains what needs attention, what is unclear, or what the new evidence has not changed.
- **Markets:** Bitget tokenized-stock discovery and quotes remain accessible. Market data is context, not evidence of event causality.
- **Share:** download a concise review card; nothing is automatically posted.

The interface supports Chinese and English. Original source text and user ideas retain their original language.

## Honest runtime status

The public site is deployed. Runtime AI code supports Qwen and user-supplied provider keys, with output and citation validation. **The competition-issued key is now configured as a server-side secret for Qwen 3.8 Max through the official Bitget gateway. Live end-to-end acceptance remains in progress; configuration is not proof of a successful Brief.** Without AI, Brief is explicitly labelled Source Brief; it does not manufacture AI conclusions. Users can connect their own supported model in Settings.

`/api/health?probe=1` reports AI configuration / observed successful inference, D1, evidence and quote availability separately. Bitget previously returned HTTP 403 from the hosted server even when local quotes worked; deployment success does not certify quote availability. Check current health before presenting.

Memory runs **on demand**, not as an autonomous background monitoring agent. Records live in the current browser; export is available under Advanced review. News coverage is limited and summaries are not full articles. No calibrated probabilities, automatic orders or performance claims.

## Run locally

Node 22.12 or newer:

```sh
npm ci
npm test
npm run build
npm start
```

The server prints its loopback URL. `PORT` selects the port. Use the UI's model settings for local BYOK testing. Production uses a Cloudflare Worker via Sites with D1 `DB`; do not put secrets in the repository or hosting manifest.

Competition gateway: `ASKSTONE_DEMO_QWEN_PROVIDER=bitget-qwen`, `ASKSTONE_DEMO_QWEN_MODEL=qwen3.8-max`, and `ASKSTONE_RERANK_MODEL=qwen3.8-max`. Requests use the documented Responses endpoint at `https://hackathon.bitgetops.com/v1/responses`; secrets are never stored in Git. This Max-only route permits up to 30 seconds for selection and 90 seconds for final analysis (150-second browser limit), rather than the direct-provider 12/45-second budgets. Workers requests use manual redirect handling to prevent credential forwarding.

Direct Alibaba Cloud setup: configure `ASKSTONE_DEMO_QWEN_KEY` as a Sites secret. Optional `ASKSTONE_DEMO_QWEN_REGION=intl` selects Singapore (default Beijing), and `ASKSTONE_DEMO_QWEN_MODEL` defaults to `qwen-plus`. Hosted selection uses `ASKSTONE_RERANK_MODEL` (default `qwen-turbo`) with a 12-second timeout; final analysis has a 45-second timeout. BYOK uses the user's selected model for both passes. Model availability and live latency still require provider testing.

Hosted attempts are limited to 15 per IP and 300 globally per UTC day through D1. Failed attempts count; an incremental review may make two model calls. No result cache is currently enabled.

## Engineering checks

GitHub Actions runs `npm ci`, `npm test`, and `npm run build` on main pushes and pull requests. Regression coverage includes immutable baselines, incremental time windows, bilingual retrieval, monitoring profiles, forged citations, quota limits and provider-key isolation. Mock-provider tests are not live Qwen acceptance evidence.

The repository name `afterbell` reflects the project's original name. The current product is **AskStone**. Historical release notes describe earlier versions; the README, Product and Submission documents describe the current experience.

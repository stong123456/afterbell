# AskStone — Product and research workflow

**AskStone remembers why you wanted the trade — then helps you see when the reason changes.**

For people researching tokenized equities, the product's unit of memory is a falsifiable assumption, not a news item or price prediction.

## Core journey

1. **Ask Stone:** enter a trade idea in ordinary language.
2. **Stone Brief:** see context, supporting and opposing evidence, missing information, and 2–4 proposed assumptions.
3. **Challenge:** test the opposing case without redefining the original assumptions.
4. **Remember:** save the original idea, timestamp, invalidation conditions and per-assumption `monitor_terms` in this browser.
5. **What Changed:** run an incremental evidence review. Summary cards lead with unreviewed leads; advanced manual audit and historical records remain available on demand.

Primary navigation is Ask Stone → Markets → Memory, following the owner's selected order. Home remains a single-input experience. Supporting tools are secondary, not prerequisites.

## Time and evidence contract

- `baselineAt`: the first Brief's timestamp; remains fixed across Challenge and Remember.
- `reviewSince`: the latest valid review's `checkedAt`, or baselineAt on the first check.
- `/api/changes` validates `baselineAt <= reviewSince <= now` and retrieves records strictly after reviewSince. Legacy callers using createdAt fall back to a first-check window.
- Results retain baselineAt, reviewSince and checkedAt. A successful check advances the next window; failed requests preserve the previous review.
- Conclusions describe this incremental window, not the overall truth of the thesis. No new evidence does not reverse an earlier challenge.

Each assumption can carry up to eight short monitoring terms generated from its dependencies. Profiles are frozen with the baseline and preserved in local storage and review history. When a profile exists, the fixed company-exposure expansion is no longer used; aliases, bilingual thesis matching and topic matching still assist recall. Older records without profiles remain supported.

Rules select up to 20 candidates. AI maps sources to assumptions (0–2 IDs each, eight total maximum), then evaluates the selected evidence. Hosted selection uses a configurable small Qwen model and 12-second timeout; final analysis uses the configured main model with 45 seconds. Empty or inconclusive evidence stays unclear; selection failure does not silently become an unchanged verdict.

States are `challenged`, `unclear`, and `no_meaningful_change`. The last requires affirmative new evidence; the UI says “新证据暂未改变这项假设”. Non-unclear conclusions require known source IDs. Structural validation cannot establish semantic truth; users should check the original links. AI results never overwrite human-confirmed audit states.

## Sources and boundaries

StoneDaily editorial feeds plus direct publisher/regulator RSS sources supply titles, excerpts, links and timestamps. Available feed coverage is limited to 30 days and is not exhaustive. Late-indexed or missing articles can be missed by publication-time windows. No claim is made to read full linked articles or detect all relevant news.

Bitget product identity and quote freshness are validated. Token quotes are not underlying-equity closes, and 24-hour changes are not event-window causal effects. No automated trades, calibrated gap probabilities, backtested returns or background notifications are offered.

## Runtime and storage

React/Vite frontend; Node local server; Sites-hosted Worker with D1 for hosted quotas and existing source storage. Decision Memory stays browser-local. BYOK settings support allowlisted providers. Hosted AI requires a dedicated secret; legacy unrelated keys are ignored. External content is untrusted data, never instructions.

The dedicated competition key is now configured for the Bitget Qwen 3.8 Max gateway; full hosted-model acceptance remains pending. Use the public health endpoint and perform a real no-BYOK demo before claiming hosted readiness.

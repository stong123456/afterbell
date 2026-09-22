# Decision Memory and What Changed

## Incremental-window and monitoring-profile update

The API now separates immutable baselineAt from reviewSince (last successful review checkedAt, or the baseline for a first check). Both retrieval and the final model payload use reviewSince. Invalid and future windows are rejected. Responses preserve both timestamps and the UI discloses the exact review window. Legacy createdAt callers retain first-check compatibility.

New AI briefs require per-assumption monitor_terms; terms are bounded, stored with the frozen baseline and passed to retrieval. Missing profiles on old records remain supported. A profile replaces the fixed company exposure expansion, while bilingual thesis/alias matching remains. This is an on-demand monitoring profile, not a background agent.

Selection timeout is now 12 seconds. Hosted selection uses configurable ASKSTONE_RERANK_MODEL (default qwen-turbo), while final analysis retains ASKSTONE_DEMO_QWEN_MODEL. BYOK uses the selected user model for both stages. Live provider latency is unverified. Model metadata distinguishes the reranker from final analysis.

52 local regression tests and the production build passed. A mock integration test verifies that both model calls receive only post-reviewSince evidence. Hosted Qwen acceptance remains blocked by the absent dedicated secret; no live model success is claimed. README, PRODUCT, SUBMISSION, repository description and homepage now identify AskStone.

## Continuity update

The first Brief's idea, assumptions and timestamp are frozen for Challenge and Remember. Challenge validates the baseline and never requests replacement assumptions. Unreviewed leads are counted since the latest valid check (or initial baseline), including records older than 24 hours; new leads take precedence over historical conclusions.

Retrieval uses company aliases, bilingual thesis phrases and explicit sector/exposure topics, not a blanket Policy/Macro bonus. An AI selection pass maps candidates to assumptions, with up to two IDs per assumption and eight total sources for assessment. Empty selections produce unclear. This is a heuristic retrieval pipeline, not a measured recall guarantee. Hosted review uses up to two bounded model calls per reserved attempt. Daily limits are 15 per IP and 300 global, including failed attempts. No response cache has been added.

Review cards can be downloaded as SVG without automatically posting to a social network. They identify unclear assumptions and distinguish source-only checks from AI analysis. GitHub Actions runs npm ci, npm test and npm run build on main pushes and pull requests. Local regression suite: 49 tests pass. No real hosted Qwen test was possible: the dedicated secret remains absent.

Markets remains in the primary navigation alongside Ask Stone and Memory. Home retains its single-input entry point. Memory now opens with thesis summary cards; manual audits, quote comparisons and archiving live under Advanced review.

AI briefs extract 2–4 separate, falsifiable assumptions with explicit invalidation conditions. They are not derived from supporting evidence checks. Without AI, the source brief stores only the original view, clearly unverified.

`POST /api/changes` compares each saved assumption against up to 20 ranked source records published after saving, within the available 30-day feed. It returns challenged, unclear or no_meaningful_change, with an explanation and source citations. The latter requires affirmative evidence, not merely absence of bad news. Validation rejects unknown citations, missing assumptions and uncited non-unclear conclusions. These checks enforce structure, not the truth of model reasoning: readers must verify the linked originals.

Reviews run on demand, use reported titles and summaries, preserve human audit statuses and retain the last ten results in this browser. There is no background monitoring or cross-device sync. No new evidence yields unclear without invoking a model. Source outages and limited coverage are disclosed; absence of evidence is not confirmation.

Stone Challenge uses a separate heading and removes the repeated Brief grid. Remember persists the current result's assumptions. Existing records remain compatible.

`/api/health?probe=1` checks D1, available evidence and fresh market data. Hosted AI reports not_configured, configured_unverified or ready; ready requires a successful hosted inference in that Worker instance. A restart can reset this last-success observation. BYOK calls do not certify hosted AI readiness.

Validation: 46 automated tests passed, including assumption extraction and citation/baseline validation. Local browser verified source brief → Remember → Memory card → What Changed with no new evidence. Hosted Qwen has not been tested with a real key: ASKSTONE_DEMO_QWEN_KEY was absent. Configure that dedicated secret before competition acceptance testing; never substitute unrelated credentials. Hosted attempts share existing D1 daily quotas.

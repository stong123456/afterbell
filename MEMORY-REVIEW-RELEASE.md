# Decision Memory and What Changed

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

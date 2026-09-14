# AfterBell on askstone.xyz

## Product decision

AfterBell is the primary product and hackathon entry at `askstone.xyz`. AskStone is the previous implementation whose useful modules are being adapted into AfterBell. The earlier two-product/subdomain proposal is superseded.

## Integrated modules

- Read-only BLS CPI with official FRED fallback and OKX BTC/ETH/PAXG observations, adapted from the old `worker/data-sources.js`. Blank numeric data is kept missing rather than coerced to zero.
- EventEdge-style evidence → transmission hypothesis → exposed assets → counter-evidence workbench, tailored to the selected AfterBell event. Transmission remains labelled a rule hypothesis.
- Background observations are served by `/api/context`, cached for 60 seconds and coalesced. Available fresh context enters reports as separate evidence with explicit background-only scope. Retrieval time is never labelled publication time.
- SHA-256 evidence fingerprints in reports and Markdown exports make evidence snapshots comparable. They are not blockchain receipts or guarantees of truth.
- Existing Chinese/English UI, StoneDaily event feeds, rToken snapshots, Challenge My Trade, local research journal and Qwen integration remain the primary workflow.

## Not imported

The old CPI/crypto heuristic confidence score, fixed portfolio allocations and Trade/Hedge/Wait thresholds are not calibrated US stock forecasts. X Layer testnet receipt submission is not part of this integration; wallet approval, contract safety and competition relevance need separate assessment before exposing it in AfterBell.

## Root-domain release

The deployment template now targets `https://askstone.xyz`. After a candidate AfterBell service passes public health, APIs and browser checks, attach the root domain and switch only the required DNS records. Preserve mail records and keep a rollback record of the old site/version and original DNS before switching. The old Sites deployment should be retained for rollback during release; it is not the new public brand.

No production deployment or DNS change has occurred. The prior Name.com browser attempt was rejected by automatic review due to the Codex usage limit. Current DNS and the old live site still require verification. Docker files are prepared but container execution remains untested. The provider template still needs an allocated application name. Qwen real-provider success remains unverified without a configured key.

Validation this iteration: 15 automated tests and production frontend build passed. See execution report for runtime/browser results.

Runtime verification: CPI returned from FRED; OKX cross-asset source was unavailable and labelled accordingly. The rule report included C1 background evidence and a SHA-256 fingerprint. Browser Chinese/English workbench and unavailable-source states were inspected; no browser error entries were returned.

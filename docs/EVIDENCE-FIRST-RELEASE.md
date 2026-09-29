# Evidence-first reading release

- Brief requests can opt into NDJSON: source evidence arrives before model inference finishes. JSON clients remain compatible. Model failure preserves the evidence and enables retry.
- Remember opens a confirmation form for 1–4 editable, falsifiable assumptions. The confirmed snapshot and original extraction are retained separately. Changing a reason clears its old generated monitoring terms.
- Memory compares original reasons, cited excerpts, implications, and remaining uncertainty. No new evidence remains unclear.
- Home displays nine source cards with publication time, excerpt, original link, and progressive loading. Flash-news headings are separated from their original body; no full articles are fabricated.

Validation: 61 unit/regression tests passed; production build passed. Local browser verified source-only brief, edited assumption confirmation, Memory save and no-new-evidence review. No browser console errors in that flow. Hosted inference requires separate production verification.

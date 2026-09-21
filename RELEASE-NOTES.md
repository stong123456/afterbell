# AfterBell research desk upgrade

- Full Bitget rToken/USDT product discovery from official symbol metadata, joined with bulk spot tickers. No fixed six-symbol cap.
- Search, pagination, turnover/change sorting, quote timestamps, product status and on-demand depth/candles.
- Browser direct public-API fallback when server access is unavailable; partial catalog/quote states remain explicit.
- Saved event research plans: horizon, trigger, invalidation, risk budget and notes. Users explicitly add plans to the thesis for analysis.
- Per-report manual review notes and outcome categories stored locally, without claiming model accuracy or trading returns.
- Rule lenses distinguish policy, earnings, rates and market structure. Buying is no longer treated as evidence of a rebound thesis.
- Raw quote evidence collapsed for readability; all three visual styles retained.

Validation: production build and 26 tests passed. Live official API returned 2125 matching catalog pairs and 2125 positive prices during the successful check; RMSFTUSDT returned a price and 168 hourly candles. An earlier network attempt returned a partial catalog, so no claim is made that every quote is continuously available. This count may include ETFs and is not a company count. UI browser regression was not rerun for this release. Actual BYOK model success remains unverified without a user key.

Remaining product limits: news asset tagging still has limited company-name coverage, no calibrated opening-gap forecasts or historical model, no orders, and no cloud sync of personal plans/reviews. The full market catalog does not imply equally complete news coverage.

## Event Detective and time capsules

- Event-relative pre-4h and post-1h/4h/24h returns using completed hourly closes; missing/future windows remain null. Four-hour volume ratio and current spread provide context.
- Editable peer set, up to four products, with source links, baseline timestamps and explicit alignment methodology.
- Rule-based for/against/next-verification framework plus existing BYOK model flow. Server independently retrieves comparison evidence as M-series references; it never treats browser-computed numbers as server observations.
- Local frozen thesis, event, quotes, windows and existing report; separate current-quote review and manual notes; JSON export. No trusted timestamp, auto-reminder, cloud sync or trading-performance claim.
- 29 tests passed and production build passed. A live NVDA/AMD/TSM comparison returned completed-hour windows; missing TSM baseline history/volume remained null. This was an arithmetic probe with a selected timestamp, not a claim that a real news event occurred then.
- No actual user-key model call or browser UI regression was performed in this release.

## Evidence homepage and publisher feeds — 2026-09-21
- Default route and wordmark now open Evidence; My theses remains a primary navigation item.
- Added direct CNBC, Federal Reserve, SEC, CoinDesk, Decrypt and TechCrunch feeds alongside StoneDaily.
- Source picker and health details expose fetch availability, timestamp and pre-dedup record counts. Canonical original URLs deduplicate cross-feed articles; only dated records from the last 30 days are retained (max 240).
- Expanded keyword asset mapping; macro stories with no mapped assets no longer default to NVDA comparisons.
- Live local check: all 7 ingestion paths returned successfully, 142 deduplicated records at browser QA time. Counts change over time and are not unique independent confirmations.
- Build and 38 tests passed. Browser confirmed default homepage, SEC filtering, article selection and source coverage. Publisher summaries remain in original language.

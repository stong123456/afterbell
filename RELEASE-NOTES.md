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

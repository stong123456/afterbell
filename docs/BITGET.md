# Bitget research loop

Direct public spot integration verifies exact R{asset}USDT/base coin/quote identity against the official symbol catalogue, before requesting ticker, top-five order book and up to 168 hourly candles. Snapshot time is distinguished from trade time. Missing data stays missing. Cache lifetimes: catalogue 5 minutes, quotes/depth 15 seconds, candles 60 seconds, with request coalescing.

Event research shows quote, 24h turnover/change, spread, visible order-book notional and price history. The event reference is the last completed hourly candle ending before publication, with a maximum one-hour gap; missing/out-of-range baselines remain unavailable. The current hourly candle may be unfinished. Neither change is an equity opening-gap forecast.

Report evidence includes direct Bitget snapshots for up to three associated assets. Reopening a saved report compares its snapshot with current data in the Bitget panel. This is research review, not executed trade P&L. The source link opens the exact official quote endpoint. An order-entry link is not yet included; no orders are submitted.

Validation: 21 tests and build passed. Direct RNVDAUSDT retrieval returned price, quote timestamp, spread and 168 hourly candles. Published UI verification is reported separately; no real model key was used.

Official API catalogue: https://www.bitget.com/zh-CN/docs/catalog/classic-spot-market/classic-spot-market

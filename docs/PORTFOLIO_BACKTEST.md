# Portfolio Backtest Semantics

`runPortfolioBacktest` is the deterministic multi-symbol replay boundary.

## Execution model

- The strategy receives only candles available at the current replay timestamp.
- An order is executed on the next global timestamp only if that symbol has a candle there.
- Each symbol is marked using its own close price.
- Missing bars are not synthesized.
- No future candle is exposed to the strategy.

## Why synchronized timestamps

Iranian equities, crypto and other markets can have different calendars and missing bars. A global timestamp index lets the portfolio engine represent asynchronous series without silently inventing data. The strategy can inspect the symbols that actually have a candle at the current timestamp.

## Known limitation

Protective exits and portfolio-level cash allocation still need a unified multi-symbol position-management policy. The current simulator remains the deterministic execution primitive. Iran-specific fees, taxes, price limits and minimum order sizes are a separate market-rule layer and are not hardcoded until verified.

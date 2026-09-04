# ARYA AI TRADER — Architecture

## Target pipeline
`Market Data -> Normalization -> Validation -> Feature/Indicator Engine -> Smart Money -> Context/News -> AI Proposal -> Risk Gate -> Position Sizing -> Execution -> Portfolio/Monitoring -> Audit`

## Layer ownership
- **Data**: external market sources, historical/live feeds, normalization and quality.
- **Analysis**: deterministic indicators and market-structure features.
- **AI**: explains context and produces a typed `TradeProposal`; it cannot place orders.
- **Risk**: deterministic safety policy. It can reject an AI proposal.
- **Execution**: broker/exchange adapter selected by mode: backtest, paper, live.
- **Portfolio**: positions, balances, exposure and P&L.
- **Audit**: append-only decision and execution events.

## Safety boundary
The only path to an order is:
`TradeProposal -> RiskDecision(approved) -> OrderIntent -> ExecutionAdapter`.
There is no direct `AI -> broker` path.

## Runtime modes
- `backtest`: historical simulation only.
- `paper`: simulated execution using live or historical data.
- `live`: disabled by default and requires explicit configuration plus operational approval.

## Migration strategy
Existing `src/arya` indicator/provider/smart-money code remains the source of truth for current deterministic analytics. New domain contracts live under `src/arya/core` and are intentionally adapter-oriented so the UI can migrate incrementally without a rewrite.

## Data integrity
Every market snapshot should identify provider, received time, source time when available, symbol, timeframe and quality. Missing or stale data must produce an explicit error/quality state, never fabricated values.

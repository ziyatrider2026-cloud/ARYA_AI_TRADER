# ARYA AI TRADER — Current Implementation Status

Updated: 2026-09-04

## Completed in the current foundation branch

- Canonical domain contracts for candles, market data, proposals, risk and execution.
- Provider abstraction with explicit provenance and `UNAVAILABLE` handling.
- Public Binance read-only adapter.
- Read-only TSETMC daily history/quote adapter.
- Iran source catalog and read-only Iran relay contract.
- Candle normalization and quality validation.
- Deterministic risk gate with confidence, stop-loss and exposure checks.
- AI proposal gateway with Zod validation.
- Paper execution boundary and deterministic paper simulator.
- Single-symbol next-bar backtest with protective stop/target exits.
- Multi-symbol synchronized portfolio replay.
- Repository-neutral persistence contract.
- Supabase/PostgREST server-side persistence adapter.
- Supabase migration schema for candles, analyses, proposals and audit events.
- Audit-store and decision-to-audit boundary.

## Not yet production-ready

- Real Iran-side collector/relay deployment.
- Verified current Codal API/collector contract.
- RLS/authenticated application read paths.
- Durable database migration execution against a real project.
- Historical cache wiring.
- Iran-specific fee/tax/price-limit/minimum-order market rules.
- Confidence calibration and production AI model adapter.
- Full portfolio monitoring/kill switch.
- Live execution adapter.

## Collaborator rules

1. Work from `feat/arya-trading-core-foundation` until the foundation is reviewed.
2. Do not merge into `main` without explicit operator approval.
3. Keep AI advisory and deterministic risk enforcement separate.
4. Do not expose Supabase service-role credentials to client code.
5. Do not call undocumented Iranian upstreams directly from browser UI.
6. Preserve provider provenance, freshness and explicit unavailable states.
7. Add tests and update `docs/CHANGELOG.md` for structural changes.

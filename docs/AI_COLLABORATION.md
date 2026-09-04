# ARYA AI TRADER — AI Collaboration Protocol

## Purpose
This project is intentionally developed with multiple AI collaborators, including Lovable and Claude. The repository is the shared source of truth.

## Rules for every AI collaborator
1. Read `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and `docs/CHANGELOG.md` before structural changes.
2. Never commit secrets, exchange credentials, private keys, or real account identifiers.
3. Never enable live trading by default.
4. AI models may create trade proposals, but may not directly authorize broker execution.
5. Deterministic risk controls must remain outside the LLM and must be enforceable server-side.
6. Preserve backward compatibility with existing UI contracts unless a migration is documented.
7. Record significant architecture changes in `docs/DECISIONS.md` and implementation changes in `docs/CHANGELOG.md`.
8. Prefer small, reviewable commits/PRs over large opaque rewrites.
9. Do not call undocumented Iranian market endpoints directly from UI components. Use provider adapters and, for production, prefer an Iran-network collector/relay.
10. Do not interpret TSETMC/Codal availability as guaranteed. Always surface provider status and freshness.
11. Backtest strategies must never receive the execution candle; protective exits must use only OHLC data from the current execution bar.
12. Supabase service-role credentials are server-only. Never place `SUPABASE_SERVICE_ROLE_KEY` in `VITE_*` variables or browser code.
13. Durable persistence must implement `PersistenceRepository`; UI components must not depend directly on vendor-specific database APIs.
14. Iran disclosure streams are optional inputs to the market collector. Their failure must degrade provenance/quality, never fabricate market prices and never hide the failure.
15. Do not create a production Codal adapter until its current public contract and deployment accessibility have been verified. Until then use the `IranDisclosureProvider` contract.

## Handoff format
Every AI handoff should state:
- What changed
- Why it changed
- Files affected
- Interfaces/contracts affected
- Tests performed
- Known limitations
- Recommended next task

## Current implementation sequence
`market adapters → normalization/validation → Iran collector → persistence → AI gateway → paper simulation → backtest → scanner/news → portfolio/monitoring → live adapter (disabled)`

## Current handoff — 2026-09-04
- **Changed:** added `IranCollectRequest`, `IranDisclosureProvider`, and a canonical `IranMarketCollector` composition layer.
- **Collector behavior:** market data is collected through the existing provider boundary; optional Codal/observer providers are composed separately. A disclosure failure does not replace or fabricate prices. The resulting envelope remains `LIVE` with reduced quality/reason metadata when appropriate.
- **TSETMC:** the existing read-only TSETMC adapter remains the current public price/history source. The Iran relay remains the production deployment boundary for network-sensitive sources.
- **Codal:** no undocumented direct endpoint was invented. The production adapter remains blocked pending contract verification; the collector accepts a verified adapter later without changing downstream contracts.
- **Persistence:** `PersistenceRepository` remains vendor-neutral; Supabase is an adapter. Historical cache wiring is still pending.
- **Security:** service-role credentials must remain server-side; browser code must use authenticated, least-privilege read paths after RLS policies are defined.
- **Do not merge:** this work is on the feature branch and must remain unmerged until review/CI approval.
- **Next task:** verify collector tests/CI, wire historical cache, verify the Supabase migration/RLS in a real project, then implement the first verified Codal/observer adapters.

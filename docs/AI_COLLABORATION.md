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
16. Server-only market access belongs behind `src/arya/server/*.server.ts` and typed `*.functions.ts` boundaries. Client components may call the server function, but must never import server-only persistence/provider implementations directly.
17. Historical-cache fallback is allowed only when live data fails and must be marked `STALE`; cached candles must never be presented as `LIVE`.

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
`market adapters → normalization/validation → Iran collector → server market gateway/cache → persistence → AI gateway → paper simulation → backtest → scanner/news → portfolio/monitoring → live adapter (disabled)`

## Current handoff — 2026-09-04
- **Changed:** added a server-only `readMarketCandles` gateway and typed `getMarketCandles` server function. Chart route now obtains its initial candles through this boundary instead of `generateSeries` mock data.
- **Cache behavior:** live provider data is persisted through `PersistenceRepository`; if live retrieval fails, only persisted candles may be returned and they are explicitly marked `STALE`. There is no synthetic fallback.
- **Symbol resolution:** the gateway accepts a canonical `symbolId` or resolves a ticker such as `شپنا` through the real provider symbol catalog. `ARYA_DEFAULT_IRAN_TICKER` can define the server default.
- **TSETMC/Relay:** if `IRAN_RELAY_BASE_URL` is configured, the server gateway uses the read-only Iran relay; otherwise it uses the server-side TSETMC adapter. Browser code never calls the upstream directly.
- **Chart:** daily data is loaded by the route loader; switching timeframe invokes the same server function. Unsupported intraday history therefore shows an explicit unavailable state instead of fabricated candles.
- **Codal:** no undocumented direct endpoint was invented. The production adapter remains blocked pending contract verification.
- **Security:** service-role credentials remain server-side. Server functions are the application boundary; private database/provider modules must not be imported into client bundles.
- **Do not merge:** this work is on the feature branch and must remain unmerged until review/CI approval.
- **Next task:** add scheduled ingestion, verify Supabase migration/RLS in a real project, then connect Scanner and Watchlist to the same server market gateway.

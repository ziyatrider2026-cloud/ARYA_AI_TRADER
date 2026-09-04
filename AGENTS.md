# ARYA AI TRADER — AI Collaboration Contract

## Purpose
This repository is a shared workspace for Lovable, Claude, and other engineering agents. The rules below prevent one agent from silently invalidating another agent's work.

## Non-negotiable rules
1. Never commit secrets, API keys, broker credentials, private tokens, or real account identifiers.
2. Live trading must remain disabled until the Risk Gate, paper trading, audit logging, and operator approval are complete.
3. AI may propose a trade; only deterministic risk and execution layers may authorize an order.
4. Preserve existing public interfaces unless a migration note is added to `docs/DECISIONS.md`.
5. Every architecture-impacting change must update `docs/CHANGELOG.md` and, when applicable, `docs/DECISIONS.md`.
6. Mock providers remain available for tests; production code must not silently fall back from live data to mock data.
7. Provider data must carry source, timestamp, symbol, timeframe, and quality/provenance metadata.
8. Browser components must never call undocumented/geo-sensitive Iranian upstreams directly.
9. Server-only modules under `src/arya/server/*.server.ts` may access environment secrets and persistence adapters; client modules must not import them directly.
10. Historical cache fallback is permitted only as `STALE` data with its original received timestamp; it must never be relabeled `LIVE`.
11. TanStack Start server functions are the preferred same-origin application boundary for market-data reads. Use server routes only when an externally callable HTTP API is intentionally required.
12. Any unsupported market timeframe or unavailable provider must surface an explicit unavailable state; never synthesize candles to keep the chart populated.

## Agent handoff
Before editing:
- read this file;
- read `docs/ARCHITECTURE.md`;
- read `docs/DECISIONS.md`;
- inspect the current branch and existing implementation.

After editing:
- document changed contracts;
- add or update tests;
- record the change in `docs/CHANGELOG.md`;
- clearly mark unfinished integrations as TODOs rather than simulating production behavior.

## Current implementation phase
Foundation plus the first real-data application boundary: contracts, domain models, provider boundaries, AI proposal schema, risk gate, execution modes, audit events, persistence adapter, Iran collector, server market-data gateway, and real-data chart integration. Live providers and broker adapters are intentionally not enabled for trading.

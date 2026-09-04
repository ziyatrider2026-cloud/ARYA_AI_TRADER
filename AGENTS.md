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
Foundation: contracts, domain models, provider boundaries, AI proposal schema, risk gate, execution modes, audit events, and observability. Live providers and broker adapters are intentionally not enabled by this foundation commit.

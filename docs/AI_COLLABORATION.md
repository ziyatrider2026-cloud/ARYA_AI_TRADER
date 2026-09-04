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

## Handoff format
Every AI handoff should state:
- What changed
- Why it changed
- Files affected
- Interfaces/contracts affected
- Tests performed
- Known limitations
- Recommended next task

## Current milestone
Trading-core foundations are being established first. The next implementation sequence is:

`market adapters → normalization/validation → persistence → AI gateway → paper simulation → backtest → scanner/news → portfolio/monitoring → live adapter (disabled)`

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
`market adapters → normalization/validation → persistence → AI gateway → paper simulation → backtest → scanner/news → portfolio/monitoring → live adapter (disabled)`

## Current handoff — 2026-09-04
- **Changed:** deterministic paper simulator, position accounting, replayable next-bar backtest, and read-only TSETMC adapter.
- **Iran data:** TSETMC public JSON is now an adapter target; Codal remains a separate disclosure boundary pending contract verification.
- **Production recommendation:** deploy an Iran-side collector/relay that polls upstream sources responsibly, validates/normalizes them, persists them, and exposes ARYA-safe application APIs.
- **Do not merge:** this work is on the feature branch and must remain unmerged until review/CI approval.
- **Next task:** stop-loss/take-profit event simulation, multi-symbol backtest accounting, durable persistence schema, and a verified Codal disclosure adapter.

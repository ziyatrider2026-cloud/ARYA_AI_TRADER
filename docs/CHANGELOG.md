# Changelog

## 2026-09-04 — Trading Core Foundation

### Added
- Shared AI-agent collaboration contract for Lovable and Claude.
- Target architecture and decision records.
- Typed domain contracts for market data, AI trade proposals, risk decisions and execution.
- Deterministic risk policy with position sizing and safety checks.
- Backtest/paper/live execution boundaries.
- Append-only audit event model and structured system health model.

### Safety
- Live execution is disabled by default.
- No secrets or credentials are committed.
- AI output cannot directly invoke an execution adapter.

### Not yet enabled
- Real-time TSETMC/crypto provider implementation.
- Broker/exchange credentials and live order submission.
- Persistent database implementation.
- Production LLM gateway wiring.

### Handoff
Lovable and Claude should read `AGENTS.md`, `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` before modifying these contracts.

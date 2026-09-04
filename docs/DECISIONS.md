# Architecture Decisions

## ADR-001 — AI is advisory, not an execution authority
**Status:** accepted

The AI layer emits a typed trade proposal. Deterministic risk controls decide whether an order may proceed. This protects the system from model hallucination, malformed output, prompt injection and unexpected provider behavior.

## ADR-002 — Explicit execution modes
**Status:** accepted

Backtest, paper and live execution are separate modes. Live mode is opt-in and disabled by default.

## ADR-003 — Provider abstraction
**Status:** accepted

Market data and execution integrations are accessed through interfaces. This allows TSETMC, crypto, forex and broker adapters to be added without coupling the domain layer to a vendor.

## ADR-004 — No silent mock fallback
**Status:** accepted

Mock data is test infrastructure. If live mode is configured but a provider is unavailable, the application must report an explicit provider error rather than silently presenting synthetic prices.

## ADR-005 — Shared-agent documentation
**Status:** accepted

Lovable, Claude and other agents must use `AGENTS.md`, this ADR log and the changelog as the handoff contract. Architecture-impacting edits must document their reason and migration impact.

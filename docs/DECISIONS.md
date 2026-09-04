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

## ADR-006 — Iran market data uses a layered, read-only ingestion strategy
**Status:** accepted

For Iranian equities, the first adapter targets the public TSETMC JSON surface (`cdn.tsetmc.com`) because it exposes symbol search, quotes, daily history, client-type data and market information without trading credentials. Community-maintained endpoint references indicate that the newer `webgw.tse.ir` gateway is a more complete official-site surface, but access can be geographically restricted. These endpoints are undocumented and may change, so the adapter must be isolated, rate-limited, health-checked and allowed to degrade to `UNAVAILABLE`.

For disclosures, ARYA will use a dedicated `DisclosureProvider` boundary rather than pretending that price APIs are a durable Codal contract. TSETMC exposes Codal-related data for some instruments, but a direct Codal adapter should only be enabled after its current public contract, response schema, rate limits and deployment accessibility are verified. Until then, disclosure ingestion is explicitly separate from market-price ingestion.

Recommended production topology: `Iran relay/collector -> normalization -> validation -> persistence -> application API`. This avoids depending on Iranian-IP availability from a browser or foreign cloud runtime and prevents the UI from calling undocumented upstream endpoints directly.

Additional sources such as official exchange/index publications, Codal, and licensed/commercial data providers can be added behind the same provider interfaces. No source may silently replace a failed real source with demo data.

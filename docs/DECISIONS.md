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

## ADR-007 — Vendor-neutral durable persistence
**Status:** accepted

ARYA persistence is defined by `PersistenceRepository`. The first production-oriented adapter targets Supabase PostgREST because it provides PostgreSQL storage without coupling domain code to a database SDK. The migration stores normalized candles, analysis snapshots, proposals and audit events with provenance-oriented fields. A Neon/PostgreSQL adapter may be added later without changing the domain contract.

Service-role credentials are server-only. Browser/client code must use authenticated least-privilege paths protected by RLS; the persistence adapter itself must never be imported into client bundles.

## ADR-008 — Multi-symbol backtest uses synchronized portfolio replay
**Status:** accepted

Portfolio backtests build a timestamp-indexed view across symbols, expose only candles available at the strategy timestamp, and execute an order only when the next timestamp contains an execution candle for that symbol. Equity is marked with each symbol's own close rather than a shared price. This preserves deterministic next-bar semantics while allowing asynchronous/missing symbol bars to be handled explicitly.

## ADR-009 — Iran collector composes independent source streams
**Status:** accepted

`IranMarketCollector` is the application ingestion boundary for Iranian market data. It composes a canonical market-data provider with optional disclosure/event providers such as Codal and observer messages. Price data and disclosures remain independently attributable and failures are preserved as provenance/reason metadata.

An unavailable optional disclosure stream must not turn valid price data into synthetic data or hide the failure. Conversely, if all required market-price inputs are unavailable, the collector returns `UNAVAILABLE`. This keeps the AI/scanner layers deterministic and prevents upstream instability from leaking into UI code.

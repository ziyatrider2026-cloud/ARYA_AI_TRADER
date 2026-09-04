-- ARYA AI TRADER core persistence schema.
-- Apply through Supabase migrations. Service-role access belongs on the server only.

create table if not exists public.market_candles (
  symbol_id text not null,
  timeframe text not null,
  candle_t bigint not null,
  open numeric not null check (open > 0),
  high numeric not null check (high > 0),
  low numeric not null check (low > 0),
  close numeric not null check (close > 0),
  volume numeric not null check (volume >= 0),
  provider_id text not null,
  received_at bigint not null,
  primary key (symbol_id, timeframe, candle_t),
  check (high >= greatest(open, close)),
  check (low <= least(open, close)),
  check (low <= high)
);

create index if not exists market_candles_lookup_idx
  on public.market_candles (symbol_id, timeframe, candle_t desc);

create table if not exists public.analysis_snapshots (
  id text primary key,
  symbol_id text not null,
  timeframe text not null,
  created_at bigint not null,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists analysis_snapshots_lookup_idx
  on public.analysis_snapshots (symbol_id, timeframe, created_at desc);

create table if not exists public.proposals (
  id text primary key,
  symbol text not null,
  action text not null check (action in ('buy', 'sell', 'hold')),
  side text check (side is null or side in ('long', 'short')),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  entry numeric,
  stop_loss numeric,
  take_profit numeric,
  thesis text not null,
  rationale jsonb not null default '[]'::jsonb,
  model text not null,
  created_at bigint not null,
  persisted_at bigint not null,
  check (action = 'hold' or side is not null),
  check (action = 'hold' or entry is not null),
  check (action = 'hold' or stop_loss is not null)
);

create index if not exists proposals_symbol_idx
  on public.proposals (symbol, persisted_at desc);

create table if not exists public.audit_events (
  id text primary key,
  type text not null check (type in ('market', 'analysis', 'ai_proposal', 'risk', 'order', 'execution', 'system')),
  actor text not null check (actor in ('system', 'ai', 'operator')),
  correlation_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at bigint not null
);

create index if not exists audit_events_correlation_idx
  on public.audit_events (correlation_id, created_at desc);

-- This migration intentionally does not grant browser write access. Configure
-- RLS/policies separately for authenticated read paths. Server-side persistence
-- uses the service role and must never expose that key to the client bundle.

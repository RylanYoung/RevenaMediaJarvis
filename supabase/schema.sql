-- Revena Media Dashboard — B2C sync tables
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query)
-- after creating the project. Modeled directly on the real Lead Distro
-- get_leads / get_campaign_performance response shapes.

create table if not exists b2c_leads (
  id uuid primary key,                 -- Lead Distro's own lead id (keeps re-sync idempotent)
  campaign_id uuid not null,
  supplier_id uuid,
  status text not null,                -- NEW / ACCEPTED / REJECTED / DISPUTED / EXPIRED / ...
  outcome text,
  state text,                          -- AU state, for geo breakdown later
  zip_code text,
  cost numeric(10, 2) default 0,       -- what Revena paid for this lead
  revenue numeric(10, 2) default 0,
  price numeric(10, 2) default 0,
  quality_score numeric,
  tags text[] default '{}',
  lead_created_at timestamptz not null,   -- when Lead Distro received the lead
  accepted_at timestamptz,
  converted_at timestamptz,
  synced_at timestamptz not null default now()
);

create index if not exists b2c_leads_campaign_id_idx on b2c_leads (campaign_id);
create index if not exists b2c_leads_lead_created_at_idx on b2c_leads (lead_created_at);

create table if not exists ad_spend (
  id bigint generated always as identity primary key,
  funnel text not null check (funnel in ('b2c', 'b2b')),
  campaign_id uuid not null,
  campaign_name text,
  spend_date date not null,            -- the single day this row covers
  total_leads integer default 0,
  accepted integer default 0,
  converted integer default 0,
  cost numeric(10, 2) default 0,
  revenue numeric(10, 2) default 0,
  profit numeric(10, 2) default 0,
  margin_pct numeric(6, 2) default 0,
  synced_at timestamptz not null default now(),
  unique (funnel, campaign_id, spend_date)  -- one row per campaign per day; re-sync overwrites via upsert
);

create index if not exists ad_spend_funnel_date_idx on ad_spend (funnel, spend_date);

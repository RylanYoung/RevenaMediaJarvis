-- Revena Media Dashboard — schema
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query)
-- after creating the project. b2c_leads / ad_spend are modeled directly on
-- the real Lead Distro get_leads / get_campaign_performance response shapes.

create table if not exists b2c_leads (
  id uuid primary key,                 -- Lead Distro's own lead id (keeps re-sync idempotent)
  campaign_id uuid not null,
  supplier_id uuid,
  buyer_id uuid,                       -- which installer client bought this lead, if any
  status text not null,                -- NEW / ACCEPTED / REJECTED / DISPUTED / EXPIRED / ...
  outcome text,
  state text,                          -- AU state, for geo breakdown later
  zip_code text,
  cost numeric(10, 2) default 0,       -- what Revena paid for this lead
  revenue numeric(10, 2) default 0,    -- what the installer buyer paid for it
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
-- Safe to re-run even if b2c_leads already existed before buyer_id was added.
alter table b2c_leads add column if not exists buyer_id uuid;

-- campaign_id is `text`, not `uuid` — Lead Distro campaigns are UUIDs but
-- Meta ad account/campaign ids are plain numeric strings, and this table
-- holds both (split by `funnel`).
create table if not exists ad_spend (
  id bigint generated always as identity primary key,
  funnel text not null check (funnel in ('b2c', 'b2b')),
  campaign_id text not null,
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

-- B2B installer sales pipeline (the Pipeline Board on B2B Pipeline).
create table if not exists b2b_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  deal_value numeric(10, 2),
  stage text not null default 'lead' check (stage in ('lead', 'called', 'booked', 'closed', 'lost')),
  source text not null default 'manual' check (source in ('manual', 'meta', 'lead-distro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz    -- set when stage moves to 'closed'; feeds the Growth Calculator's real avg deal size
);

create index if not exists b2b_leads_stage_idx on b2b_leads (stage);

-- Fixed monthly software/overhead costs (Financials page).
create table if not exists fixed_costs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monthly_amount numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

-- Manual revenue entries (Financials page) — always available alongside
-- Lead Distro- and Stripe-derived revenue, e.g. for cash/bank transfer
-- payments that never touch Stripe.
create table if not exists revenue_entries (
  id uuid primary key default gen_random_uuid(),
  amount numeric(10, 2) not null,
  description text,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Installer client payments — confirmed live via the real Stripe account:
-- charges flow through GoHighLevel invoicing into Stripe. id is Stripe's
-- own charge id, keeping re-sync idempotent.
create table if not exists stripe_payments (
  id text primary key,               -- Stripe charge id, e.g. ch_...
  amount numeric(10, 2) not null,    -- converted from Stripe's cents
  currency text not null,
  customer_id text,
  description text,
  status text not null,
  refunded boolean not null default false,
  paid_at timestamptz not null,      -- Stripe's `created` timestamp
  synced_at timestamptz not null default now()
);

create index if not exists stripe_payments_paid_at_idx on stripe_payments (paid_at);

-- Installer clients (the Clients page). Rows synced from Lead Distro
-- (list_buyers + get_lead_breakdown) get lead_distro_buyer_id set and
-- leads_purchased/total_revenue kept current on each sync; fully manual
-- clients (not in Lead Distro yet) just have source='manual' and no
-- buyer id. status flips to 'past' + churned_at set when a client leaves
-- — that's what powers the real Churn Rate on Overview/B2B Pipeline.
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  lead_distro_buyer_id uuid unique,
  name text not null,
  status text not null default 'active' check (status in ('active', 'past')),
  leads_purchased integer not null default 0,
  total_revenue numeric(10, 2) not null default 0,
  notes text,
  source text not null default 'manual' check (source in ('manual', 'lead-distro')),
  started_at date not null default current_date,
  churned_at timestamptz,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_status_idx on clients (status);

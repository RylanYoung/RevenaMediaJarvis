"use client";

import { useState } from "react";
import { StatTile } from "@/components/ui/stat-tile";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { usePollingEffect } from "@/hooks/use-polling-effect";

type Summary = {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  marginPct: number | null;
  dateFrom: string;
  dateTo: string;
  b2cSpend: number;
  b2bSpend: number;
  fixedCostsProrated: number;
  leadDistroRevenue: number;
  stripeRevenue: number;
  manualRevenue: number;
};

function currency(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function fetchSummary(
  setSummary: (s: Summary) => void,
  setError: (e: string | null) => void
) {
  fetch("/api/financials/summary?days=30")
    .then((res) => res.json())
    .then((json) => {
      if (!json.ok) throw new Error(json.error);
      setSummary(json);
      setError(null);
    })
    .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
}

export function FinancialsSummary({ initialSummary }: { initialSummary?: Summary | null }) {
  const [summary, setSummary] = useState<Summary | null>(initialSummary ?? null);
  const [error, setError] = useState<string | null>(null);

  usePollingEffect(() => fetchSummary(setSummary, setError));

  const hint = summary ? `${summary.dateFrom} to ${summary.dateTo}` : error ? "Not connected" : "Loading…";

  return (
    <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Total Revenue"
        value={summary ? <AnimatedNumber value={summary.totalRevenue} format={currency} /> : "—"}
        hint={hint}
      />
      <StatTile
        label="Total Expenses"
        value={summary ? <AnimatedNumber value={summary.totalExpenses} format={currency} /> : "—"}
        hint="Ad spend + fixed costs"
      />
      <StatTile
        label="Net Profit"
        value={summary ? <AnimatedNumber value={summary.profit} format={currency} /> : "—"}
        hint="Revenue − Expenses"
        tone="accent"
      />
      <StatTile
        label="All-in Margin %"
        value={
          summary && summary.marginPct !== null ? (
            <AnimatedNumber value={summary.marginPct} format={(n) => `${n.toFixed(0)}%`} />
          ) : (
            "—"
          )
        }
        hint="Net Profit ÷ Revenue"
        tone="accent"
      />
    </div>
  );
}

export function RevenueBreakdown({ initialSummary }: { initialSummary?: Summary | null }) {
  const [summary, setSummary] = useState<Summary | null>(initialSummary ?? null);
  const [error, setError] = useState<string | null>(null);

  usePollingEffect(() => fetchSummary(setSummary, setError));

  const rows: Array<[string, number | null]> = summary
    ? [
        ["Stripe (installer invoices)", summary.stripeRevenue],
        ["Lead Distro (accepted leads)", summary.leadDistroRevenue],
        ["Manual entries", summary.manualRevenue],
      ]
    : [
        ["Stripe (installer invoices)", null],
        ["Lead Distro (accepted leads)", null],
        ["Manual entries", null],
      ];

  return (
    <div className="divide-y divide-border border-b border-border">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
          <span className="text-muted">{label}</span>
          <span className="font-mono text-foreground">
            {value !== null ? <AnimatedNumber value={value} format={currency} /> : error ? "—" : "…"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ExpensesBreakdown({ initialSummary }: { initialSummary?: Summary | null }) {
  const [summary, setSummary] = useState<Summary | null>(initialSummary ?? null);
  const [error, setError] = useState<string | null>(null);

  usePollingEffect(() => fetchSummary(setSummary, setError));

  const rows: Array<[string, number | null]> = summary
    ? [
        ["B2C Ad Spend (Lead Distro)", summary.b2cSpend],
        ["B2B Ad Spend (Meta)", summary.b2bSpend],
        ["Fixed Software Costs", summary.fixedCostsProrated],
      ]
    : [
        ["B2C Ad Spend (Lead Distro)", null],
        ["B2B Ad Spend (Meta)", null],
        ["Fixed Software Costs", null],
      ];

  return (
    <div className="divide-y divide-border">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
          <span className="text-muted">{label}</span>
          <span className="font-mono text-foreground">
            {value !== null ? <AnimatedNumber value={value} format={currency} /> : error ? "—" : "…"}
          </span>
        </div>
      ))}
    </div>
  );
}

function pct(n: number) {
  return `${n.toFixed(0)}%`;
}

// Ad Spend Efficiency on Financials — was a permanent static "—" before,
// never actually wired to the summary data sitting right next to it.
export function AdSpendEfficiency({ initialSummary }: { initialSummary?: Summary | null }) {
  const [summary, setSummary] = useState<Summary | null>(initialSummary ?? null);
  const [error, setError] = useState<string | null>(null);

  usePollingEffect(() => fetchSummary(setSummary, setError));

  const na = summary ? undefined : error ? "—" : "…";
  const ratio = (spend: number) => (summary && summary.totalRevenue > 0 ? (spend / summary.totalRevenue) * 100 : null);

  return (
    <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatTile
        label="B2C Ad Spend : Revenue"
        value={na ?? (ratio(summary!.b2cSpend) !== null ? <AnimatedNumber value={ratio(summary!.b2cSpend)!} format={pct} /> : "—")}
        hint="B2C spend ÷ total revenue"
      />
      <StatTile
        label="B2B Ad Spend : Revenue"
        value={na ?? (ratio(summary!.b2bSpend) !== null ? <AnimatedNumber value={ratio(summary!.b2bSpend)!} format={pct} /> : "—")}
        hint="B2B spend ÷ total revenue"
      />
      <StatTile
        label="Total Ad Spend : Revenue"
        value={
          na ??
          (ratio(summary!.b2cSpend + summary!.b2bSpend) !== null ? (
            <AnimatedNumber value={ratio(summary!.b2cSpend + summary!.b2bSpend)!} format={pct} />
          ) : (
            "—"
          ))
        }
        hint="Combined, for reference only"
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { StatTile } from "@/components/ui/stat-tile";

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

export function FinancialsSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/financials/summary?days=30")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setSummary(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  const hint = summary ? `${summary.dateFrom} to ${summary.dateTo}` : error ? "Not connected" : "Loading…";

  return (
    <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Total Revenue" value={summary ? currency(summary.totalRevenue) : "—"} hint={hint} />
      <StatTile label="Total Expenses" value={summary ? currency(summary.totalExpenses) : "—"} hint="Ad spend + fixed costs" />
      <StatTile
        label="Net Profit"
        value={summary ? currency(summary.profit) : "—"}
        hint="Revenue − Expenses"
        tone="accent"
      />
      <StatTile
        label="All-in Margin %"
        value={summary && summary.marginPct !== null ? `${summary.marginPct.toFixed(0)}%` : "—"}
        hint="Net Profit ÷ Revenue"
        tone="accent"
      />
    </div>
  );
}

export function RevenueBreakdown() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/financials/summary?days=30")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setSummary(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

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
          <span className="font-mono text-foreground">{value !== null ? currency(value) : error ? "—" : "…"}</span>
        </div>
      ))}
    </div>
  );
}

export function ExpensesBreakdown() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/financials/summary?days=30")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setSummary(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

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
          <span className="font-mono text-foreground">{value !== null ? currency(value) : error ? "—" : "…"}</span>
        </div>
      ))}
    </div>
  );
}

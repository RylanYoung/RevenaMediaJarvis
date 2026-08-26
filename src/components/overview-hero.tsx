"use client";

import { useState } from "react";
import { StatTile } from "@/components/ui/stat-tile";
import { usePollingEffect } from "@/hooks/use-polling-effect";

const RANGES = [
  { key: "7d", label: "7D", hint: "Last 7 days", days: 7 },
  { key: "30d", label: "30D", hint: "Last 30 days", days: 30 },
  { key: "90d", label: "90D", hint: "Last 90 days", days: 90 },
  { key: "mtd", label: "MTD", hint: "Month to date", days: new Date().getDate() },
  { key: "6m", label: "6M", hint: "Last 6 months", days: 182 },
  { key: "1y", label: "1Y", hint: "Last 12 months", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

type Summary = {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  marginPct: number | null;
};

function currency(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

export function OverviewHero() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = RANGES.find((r) => r.key === range)!;

  usePollingEffect(
    () => {
      fetch(`/api/financials/summary?days=${active.days}`)
        .then((res) => res.json())
        .then((json) => {
          if (!json.ok) throw new Error(json.error);
          setSummary(json);
          setError(null);
        })
        // Keep showing the last good numbers on a transient poll failure —
        // only fall back to "—" if nothing has loaded successfully yet.
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
    },
    15000,
    [active.days] // switching the range re-fetches immediately, not on the next tick
  );

  const na = summary ? undefined : error ? "—" : "…";

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Snapshot — {active.hint}
        </p>
        <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                setRange(r.key);
                setSummary(null);
              }}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r.key
                  ? "bg-surface-hover text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="reveal-group grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Revenue"
          value={na ?? currency(summary!.totalRevenue)}
          hint={`Stripe + Lead Distro + manual — ${active.hint.toLowerCase()}`}
        />
        <StatTile label="Expenses" value={na ?? currency(summary!.totalExpenses)} hint="Ad spend + fixed costs" />
        <StatTile
          label="Margin %"
          value={na ?? (summary!.marginPct !== null ? `${summary!.marginPct.toFixed(0)}%` : "—")}
          hint="Profit ÷ Revenue"
          tone="accent"
        />
        <StatTile label="Profit" value={na ?? currency(summary!.profit)} hint="Revenue − Expenses" tone="accent" />
      </div>
    </div>
  );
}

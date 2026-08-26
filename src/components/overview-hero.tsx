"use client";

import { useState } from "react";
import { StatTile } from "@/components/ui/stat-tile";

const RANGES = [
  { key: "7d", label: "7D", hint: "Last 7 days" },
  { key: "30d", label: "30D", hint: "Last 30 days" },
  { key: "90d", label: "90D", hint: "Last 90 days" },
  { key: "mtd", label: "MTD", hint: "Month to date" },
  { key: "6m", label: "6M", hint: "Last 6 months" },
  { key: "1y", label: "1Y", hint: "Last 12 months" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

export function OverviewHero() {
  const [range, setRange] = useState<RangeKey>("30d");
  const hint = RANGES.find((r) => r.key === range)!.hint;

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Snapshot — {hint}
        </p>
        <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
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
        <StatTile label="Revenue" value="—" hint={`Stripe — ${hint.toLowerCase()}`} />
        <StatTile label="Expenses" value="—" hint="Ad spend + fixed costs" />
        <StatTile label="Margin %" value="—" hint="Profit ÷ Revenue" tone="accent" />
        <StatTile label="Profit" value="—" hint="Revenue − Expenses" tone="accent" />
      </div>
    </div>
  );
}

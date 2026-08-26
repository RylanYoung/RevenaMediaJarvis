"use client";

import { useState } from "react";
import { StatTile } from "@/components/ui/stat-tile";
import { usePollingEffect } from "@/hooks/use-polling-effect";

type Metrics = {
  totalLeads: number;
  bookedCount: number;
  closedCount: number;
  lostCount: number;
  avgDealSize: number | null;
  totalB2BSpend: number;
  cpl: number | null;
  cac: number | null;
  leadToCalledPct: number | null;
  calledToBookedPct: number | null;
  bookedToClosedPct: number | null;
  lostRatePct: number | null;
};

function currency(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function useB2BMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePollingEffect(() => {
    fetch("/api/b2b/metrics?days=30")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setMetrics(json);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  });

  return { metrics, error };
}

// Top stat row on B2B Pipeline — real numbers straight from b2b_leads +
// ad_spend, the same tables the board and sync buttons write to.
export function B2BPipelineStats() {
  const { metrics, error } = useB2BMetrics();
  // Prioritize already-loaded data over a later transient poll error —
  // a momentary failure shouldn't blank out real numbers already on screen.
  const na = metrics ? undefined : error ? "—" : "…";

  return (
    <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatTile
        label="Cost per Lead (CPL)"
        value={na ?? currency(metrics!.cpl ?? 0)}
        hint="B2B ad spend ÷ leads"
      />
      <StatTile label="Leads" value={na ?? String(metrics!.totalLeads)} hint="All-time, from Meta / Lead Distro / manual" />
      <StatTile label="Booked" value={na ?? String(metrics!.bookedCount)} hint="Currently at Booked or later" />
      <StatTile label="Closed" value={na ?? String(metrics!.closedCount)} hint="Won deals" tone="positive" />
      <StatTile
        label="Avg. Deal Size"
        value={na ?? (metrics!.avgDealSize !== null ? currency(metrics!.avgDealSize) : "—")}
        hint="Avg. value of closed deals"
      />
      <StatTile
        label="Lost Rate"
        value={na ?? (metrics!.lostRatePct !== null ? `${metrics!.lostRatePct.toFixed(0)}%` : "—")}
        hint="Lost ÷ total leads"
        tone="negative"
      />
    </div>
  );
}

// The B2B section on Overview — only the metrics that are honestly
// computable from real data land here (CAC, spend, active clients).
// LTV and churn need lifetime/cancellation tracking that doesn't exist
// yet, so those stay as explicit placeholders rather than a fabricated number.
export function B2BOverviewStats() {
  const { metrics, error } = useB2BMetrics();
  // Prioritize already-loaded data over a later transient poll error —
  // a momentary failure shouldn't blank out real numbers already on screen.
  const na = metrics ? undefined : error ? "—" : "…";

  return (
    <>
      <StatTile
        label="Installer CAC"
        value={na ?? (metrics!.cac !== null ? currency(metrics!.cac) : "—")}
        hint="B2B ad spend ÷ closed deals"
        tone="accent"
      />
      <StatTile label="Installer LTV" value="—" hint="Needs churn/lifetime tracking" tone="accent" />
      <StatTile label="LTV : CAC ratio" value="—" hint="Needs churn/lifetime tracking" />
      <StatTile label="Monthly Churn Rate" value="—" hint="Needs churn tracking" />
      <StatTile
        label="Active Installer Clients"
        value={na ?? String(metrics!.closedCount)}
        hint="Closed deals, all-time"
      />
      <StatTile
        label="B2B Ad Spend"
        value={na ?? currency(metrics!.totalB2BSpend)}
        hint="Last 30 days — Meta + manual"
      />
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";

function currency(n: number) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

function round(n: number) {
  return isFinite(n) ? Math.ceil(n) : 0;
}

export default function GrowthCalculatorPage() {
  const [targetRevenue, setTargetRevenue] = useState(50000);
  const [avgDealSize, setAvgDealSize] = useState(2000);
  const [leadToQualified, setLeadToQualified] = useState(40);
  const [qualifiedToClosed, setQualifiedToClosed] = useState(30);
  const [costPerLead, setCostPerLead] = useState(35);

  const result = useMemo(() => {
    const closed = targetRevenue / (avgDealSize || 1);
    const qualified = closed / ((qualifiedToClosed || 0.0001) / 100);
    const leads = qualified / ((leadToQualified || 0.0001) / 100);
    const spend = leads * costPerLead;
    return { closed, qualified, leads, spend };
  }, [targetRevenue, avgDealSize, leadToQualified, qualifiedToClosed, costPerLead]);

  return (
    <>
      <PageHeader
        title="Growth Calculator"
        description="B2B only — reverse-engineer a target monthly revenue into the leads and qualified calls needed, using real historical conversion rates once available."
      />

      <div className="reveal-group grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Inputs" subtitle="Defaults shown — replace with your real historical rates" />
          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            <Field label="Target Monthly Revenue (AUD)">
              <input
                type="number"
                value={targetRevenue}
                onChange={(e) => setTargetRevenue(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </Field>
            <Field label="Avg. Deal Size (AUD)">
              <input
                type="number"
                value={avgDealSize}
                onChange={(e) => setAvgDealSize(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </Field>
            <Field label="Lead → Qualified Call %">
              <input
                type="number"
                value={leadToQualified}
                onChange={(e) => setLeadToQualified(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </Field>
            <Field label="Qualified → Closed %">
              <input
                type="number"
                value={qualifiedToClosed}
                onChange={(e) => setQualifiedToClosed(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </Field>
            <Field label="Cost per Lead (AUD)">
              <input
                type="number"
                value={costPerLead}
                onChange={(e) => setCostPerLead(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="What it takes" subtitle="Backwards from your revenue target" />
          <div className="grid grid-cols-3 gap-4 p-5">
            <StatTile label="Closed deals needed" value={`${round(result.closed)}`} />
            <StatTile label="Qualified calls needed" value={`${round(result.qualified)}`} />
            <StatTile label="Leads needed" value={`${round(result.leads)}`} />
          </div>
          <div className="px-5 pb-5">
            <StatTile
              label="B2B Ad Spend Required"
              value={currency(result.spend)}
              hint="Leads needed × cost per lead"
              tone="accent"
            />
          </div>
        </Card>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

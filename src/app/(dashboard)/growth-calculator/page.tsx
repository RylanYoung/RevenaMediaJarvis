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
  const [avgDealValue, setAvgDealValue] = useState(2000);
  const [leadToCalled, setLeadToCalled] = useState(40);
  const [calledToBooked, setCalledToBooked] = useState(50);
  const [bookedToClosed, setBookedToClosed] = useState(30);
  const [costPerLead, setCostPerLead] = useState(35);

  const result = useMemo(() => {
    const deals = targetRevenue / (avgDealValue || 1);
    const booked = deals / ((bookedToClosed || 0.0001) / 100);
    const called = booked / ((calledToBooked || 0.0001) / 100);
    const leads = called / ((leadToCalled || 0.0001) / 100);
    const spend = leads * costPerLead;
    return { deals, booked, called, leads, spend };
  }, [targetRevenue, avgDealValue, leadToCalled, calledToBooked, bookedToClosed, costPerLead]);

  return (
    <>
      <PageHeader
        title="Growth Calculator"
        description="Reverse-engineer a target monthly revenue into the deals, calls, and leads needed — using real historical conversion rates once available."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
            <Field label="Avg. Deal Value (AUD)">
              <input
                type="number"
                value={avgDealValue}
                onChange={(e) => setAvgDealValue(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </Field>
            <Field label="Lead → Called %">
              <input
                type="number"
                value={leadToCalled}
                onChange={(e) => setLeadToCalled(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </Field>
            <Field label="Called → Booked %">
              <input
                type="number"
                value={calledToBooked}
                onChange={(e) => setCalledToBooked(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </Field>
            <Field label="Booked → Closed %">
              <input
                type="number"
                value={bookedToClosed}
                onChange={(e) => setBookedToClosed(Number(e.target.value))}
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
          <div className="grid grid-cols-2 gap-4 p-5">
            <StatTile label="Deals needed" value={`${round(result.deals)}`} />
            <StatTile label="Booked calls needed" value={`${round(result.booked)}`} />
            <StatTile label="Calls needed" value={`${round(result.called)}`} />
            <StatTile label="Leads needed" value={`${round(result.leads)}`} />
          </div>
          <div className="px-5 pb-5">
            <StatTile
              label="B2C Ad Spend Required"
              value={currency(result.spend)}
              hint="Leads needed × cost per lead"
              tone="positive"
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

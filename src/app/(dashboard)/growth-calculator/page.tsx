"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { FormField, inputClass } from "@/components/ui/form-field";

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

// Numbers are kept as raw strings so the field mirrors exactly what's
// typed (no forced Number() coercion on every keystroke, which is what
// causes the field to snap to a stray leading "0"). Parsed only when
// used in a calculation.
function num(s: string) {
  return s === "" ? 0 : Number(s);
}

type Defaults = {
  hasData: boolean;
  sampleSize: number;
  avgDealValue: number | null;
  costPerLead: number | null;
  leadToCalled: number | null;
  calledToBooked: number | null;
  bookedToClosed: number | null;
};

export default function GrowthCalculatorPage() {
  const [targetRevenue, setTargetRevenue] = useState("50000");
  const [avgDealSize, setAvgDealSize] = useState("2000");
  const [leadToCalled, setLeadToCalled] = useState("40");
  const [calledToBooked, setCalledToBooked] = useState("50");
  const [bookedToClosed, setBookedToClosed] = useState("30");
  const [costPerLead, setCostPerLead] = useState("35");
  const [avgMonthlyValue, setAvgMonthlyValue] = useState("500");
  const [clientLifetimeMonths, setClientLifetimeMonths] = useState("6");
  const [usingRealData, setUsingRealData] = useState(false);

  useEffect(() => {
    fetch("/api/growth-calculator/defaults")
      .then((res) => res.json())
      .then((json: Defaults & { ok: boolean }) => {
        if (!json.ok || !json.hasData) return;
        if (json.avgDealValue !== null) setAvgDealSize(String(Math.round(json.avgDealValue)));
        if (json.costPerLead !== null) setCostPerLead(String(Math.round(json.costPerLead)));
        if (json.leadToCalled !== null) setLeadToCalled(String(Math.round(json.leadToCalled)));
        if (json.calledToBooked !== null) setCalledToBooked(String(Math.round(json.calledToBooked)));
        if (json.bookedToClosed !== null) setBookedToClosed(String(Math.round(json.bookedToClosed)));
        setUsingRealData(true);
      })
      .catch(() => {
        // Supabase not connected yet — the static defaults above stand.
      });
  }, []);

  const result = useMemo(() => {
    const revenue = num(targetRevenue);
    const dealSize = num(avgDealSize);
    const leadToCalledPct = num(leadToCalled);
    const calledToBookedPct = num(calledToBooked);
    const bookedToClosedPct = num(bookedToClosed);
    const cpl = num(costPerLead);
    const monthlyValue = num(avgMonthlyValue);
    const lifetimeMonths = num(clientLifetimeMonths);

    const closed = revenue / (dealSize || 1);
    const booked = closed / ((bookedToClosedPct || 0.0001) / 100);
    const called = booked / ((calledToBookedPct || 0.0001) / 100);
    const leads = called / ((leadToCalledPct || 0.0001) / 100);
    const spend = leads * cpl;
    const cac = spend / (closed || 0.0001);
    const ltv = monthlyValue * lifetimeMonths;
    const ltvToCac = ltv / (cac || 0.0001);

    return { closed, booked, called, leads, spend, cac, ltv, ltvToCac };
  }, [
    targetRevenue,
    avgDealSize,
    leadToCalled,
    calledToBooked,
    bookedToClosed,
    costPerLead,
    avgMonthlyValue,
    clientLifetimeMonths,
  ]);

  return (
    <>
      <PageHeader
        title="Growth Calculator"
        description="B2B only — reverse-engineer a target monthly revenue into the pipeline and spend needed."
      />

      <div className="reveal-group grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Inputs"
            subtitle={
              usingRealData
                ? "Pre-filled from your real B2B Pipeline data — still fully editable"
                : "Default assumptions shown — connect Supabase and log pipeline leads to use real numbers"
            }
          />
          <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
            <FormField label="Target Monthly Revenue (AUD)">
              <input
                type="number"
                value={targetRevenue}
                onChange={(e) => setTargetRevenue(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Avg. Deal Size (AUD)">
              <input
                type="number"
                value={avgDealSize}
                onChange={(e) => setAvgDealSize(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Lead → Called %">
              <input
                type="number"
                value={leadToCalled}
                onChange={(e) => setLeadToCalled(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Called → Booked %">
              <input
                type="number"
                value={calledToBooked}
                onChange={(e) => setCalledToBooked(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Booked → Closed %">
              <input
                type="number"
                value={bookedToClosed}
                onChange={(e) => setBookedToClosed(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Cost per Lead (AUD)">
              <input
                type="number"
                value={costPerLead}
                onChange={(e) => setCostPerLead(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Avg. Monthly Value per Client (AUD)">
              <input
                type="number"
                value={avgMonthlyValue}
                onChange={(e) => setAvgMonthlyValue(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Avg. Client Lifetime (months)">
              <input
                type="number"
                value={clientLifetimeMonths}
                onChange={(e) => setClientLifetimeMonths(e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>
        </Card>

        <Card>
          <CardHeader title="What it takes" subtitle="Backwards from your revenue target" />
          <div className="grid grid-cols-3 gap-4 p-5">
            <StatTile label="Closed deals needed" value={`${round(result.closed)}`} />
            <StatTile label="Booked needed" value={`${round(result.booked)}`} />
            <StatTile label="Calls needed" value={`${round(result.called)}`} />
          </div>
          <div className="px-5">
            <StatTile label="Leads needed" value={`${round(result.leads)}`} />
          </div>
          <div className="grid grid-cols-1 gap-4 px-5 pb-5 pt-4 sm:grid-cols-2">
            <StatTile
              label="B2B Ad Spend Required"
              value={currency(result.spend)}
              hint="Leads needed × cost per lead"
            />
            <StatTile label="CAC" value={currency(result.cac)} hint="Ad spend ÷ closed deals" tone="accent" />
          </div>
          <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
            <StatTile label="LTV" value={currency(result.ltv)} hint="Monthly value × lifetime" tone="accent" />
            <StatTile
              label="LTV : CAC"
              value={isFinite(result.ltvToCac) ? `${result.ltvToCac.toFixed(1)}x` : "—"}
              hint="Above 3x is healthy"
              tone={result.ltvToCac >= 3 ? "positive" : "negative"}
            />
          </div>
        </Card>
      </div>
    </>
  );
}

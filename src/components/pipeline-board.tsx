"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";

type Stage = "leads" | "qualified" | "closed";

type Lead = {
  id: string;
  name: string;
  dealValue?: number;
  source: "manual" | "meta" | "lead-distro";
  stage: Stage;
};

const STAGE_ORDER: Stage[] = ["leads", "qualified", "closed"];

const STAGE_META: Record<Stage, { title: string; hint: string }> = {
  leads: { title: "Leads", hint: "In from Meta / Lead Distro" },
  qualified: { title: "Qualified Call", hint: "Call booked" },
  closed: { title: "Closed", hint: "Job won" },
};

function currency(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

export function PipelineBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [name, setName] = useState("");
  const [dealValue, setDealValue] = useState("");

  const byStage = useMemo(() => {
    const grouped: Record<Stage, Lead[]> = { leads: [], qualified: [], closed: [] };
    for (const lead of leads) grouped[lead.stage].push(lead);
    return grouped;
  }, [leads]);

  const conversion = useMemo(() => {
    const total = leads.length;
    const reachedQualified = byStage.qualified.length + byStage.closed.length;
    const reachedClosed = byStage.closed.length;
    return {
      leadToQualified: total > 0 ? (reachedQualified / total) * 100 : null,
      qualifiedToClosed: reachedQualified > 0 ? (reachedClosed / reachedQualified) * 100 : null,
      leadToClosed: total > 0 ? (reachedClosed / total) * 100 : null,
    };
  }, [leads, byStage]);

  function addLead(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLeads((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        dealValue: dealValue ? Number(dealValue) : undefined,
        source: "manual",
        stage: "leads",
      },
    ]);
    setName("");
    setDealValue("");
  }

  function move(id: string, direction: 1 | -1) {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== id) return lead;
        const nextIndex = STAGE_ORDER.indexOf(lead.stage) + direction;
        if (nextIndex < 0 || nextIndex >= STAGE_ORDER.length) return lead;
        return { ...lead, stage: STAGE_ORDER[nextIndex] };
      })
    );
  }

  function remove(id: string) {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  }

  return (
    <Card>
      <CardHeader
        title="Pipeline Board"
        subtitle="Leads land here automatically from Meta / Lead Distro once connected — move them by hand as calls get booked and jobs close"
      />

      <div className="border-b border-border p-5">
        <form onSubmit={addLead} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 min-w-[160px] flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Lead name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Smith Solar Install"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
          <label className="flex w-36 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Deal size (AUD)</span>
            <input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            + Add lead
          </button>
        </form>
        <p className="mt-2 text-[11px] text-muted">
          Stored in this browser session only — connect Supabase to keep these permanently.
        </p>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {STAGE_ORDER.map((stage) => (
          <div key={stage} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{STAGE_META[stage].title}</p>
                <p className="text-[11px] text-muted">{STAGE_META[stage].hint}</p>
              </div>
              <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-mono text-muted">
                {byStage[stage].length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {byStage[stage].length === 0 && (
                <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
                  No leads here yet
                </p>
              )}
              {byStage[stage].map((lead) => (
                <div
                  key={lead.id}
                  className="reveal rounded-md border border-border bg-surface-hover px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-foreground">{lead.name}</p>
                      {lead.dealValue !== undefined && (
                        <p className="text-xs text-muted">{currency(lead.dealValue)}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(lead.id)}
                      aria-label="Remove lead"
                      className="text-muted transition-colors hover:text-negative"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {stage !== "leads" && (
                      <button
                        type="button"
                        onClick={() => move(lead.id, -1)}
                        className="rounded border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent hover:text-accent"
                      >
                        ← Back
                      </button>
                    )}
                    {stage !== "closed" && (
                      <button
                        type="button"
                        onClick={() => move(lead.id, 1)}
                        className="rounded border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent hover:text-accent"
                      >
                        {stage === "leads" ? "Book call →" : "Close →"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <ConversionStat label="Lead → Qualified" value={conversion.leadToQualified} />
        <ConversionStat label="Qualified → Closed" value={conversion.qualifiedToClosed} />
        <ConversionStat label="Lead → Closed" value={conversion.leadToClosed} />
      </div>
    </Card>
  );
}

function ConversionStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-foreground">
        {value === null ? "—" : `${value.toFixed(0)}%`}
      </p>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type Stage = "lead" | "called" | "booked" | "closed" | "lost";

type Lead = {
  id: string;
  name: string;
  deal_value: number | null;
  source: "manual" | "meta" | "lead-distro";
  stage: Stage;
  created_at: string;
};

const FORWARD_STAGES: Stage[] = ["lead", "called", "booked", "closed"];
const BOARD_STAGES: Stage[] = ["lead", "called", "booked", "closed", "lost"];

const STAGE_META: Record<Stage, { title: string; hint: string }> = {
  lead: { title: "Lead", hint: "In from Meta / Lead Distro" },
  called: { title: "Called", hint: "First contact made" },
  booked: { title: "Booked", hint: "Job/quote booked" },
  closed: { title: "Closed", hint: "Job won" },
  lost: { title: "Lost", hint: "Didn't convert" },
};

function currency(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export function PipelineBoard() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoadError(null);
    try {
      const res = await fetch("/api/pipeline/leads");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load pipeline");
      setLeads(json.leads);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load pipeline");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byStage = useMemo(() => {
    const grouped: Record<Stage, Lead[]> = { lead: [], called: [], booked: [], closed: [], lost: [] };
    for (const l of leads ?? []) grouped[l.stage].push(l);
    return grouped;
  }, [leads]);

  const conversion = useMemo(() => {
    const total = leads?.length ?? 0;
    const everCalled = FORWARD_STAGES.slice(1).flatMap((s) => byStage[s]).length;
    const everBooked = FORWARD_STAGES.slice(2).flatMap((s) => byStage[s]).length;
    const closed = byStage.closed.length;
    const lost = byStage.lost.length;
    return {
      leadToCalled: total > 0 ? (everCalled / total) * 100 : null,
      calledToBooked: everCalled > 0 ? (everBooked / everCalled) * 100 : null,
      bookedToClosed: everBooked > 0 ? (closed / everBooked) * 100 : null,
      lostRate: total > 0 ? (lost / total) * 100 : null,
    };
  }, [leads, byStage]);

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/pipeline/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), deal_value: dealValue || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to add lead");
      setLeads((prev) => [json.lead, ...(prev ?? [])]);
      setName("");
      setDealValue("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to add lead");
    } finally {
      setSubmitting(false);
    }
  }

  async function move(id: string, stage: Stage) {
    setLeads((prev) => (prev ?? []).map((l) => (l.id === id ? { ...l, stage } : l)));
    try {
      const res = await fetch(`/api/pipeline/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to move lead");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to move lead");
      load(); // resync on failure
    }
  }

  async function remove(id: string) {
    setLeads((prev) => (prev ?? []).filter((l) => l.id !== id));
    try {
      const res = await fetch(`/api/pipeline/leads/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to remove lead");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to remove lead");
      load();
    }
  }

  return (
    <Card>
      <CardHeader
        title="Pipeline Board"
        subtitle="Leads land here automatically from Meta / Lead Distro once connected — move them by hand as calls get made, jobs get booked, and deals close"
      />

      <div className="border-b border-border p-5">
        <form onSubmit={addLead} className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[160px] flex-1 flex-col gap-1.5">
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
            disabled={submitting}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            + Add lead
          </button>
        </form>
        {loadError && <p className="mt-2 text-[11px] text-negative">{loadError}</p>}
      </div>

      {leads === null && !loadError ? (
        <div className="p-5">
          <EmptyState title="Loading pipeline…" description="Fetching leads from Supabase." />
        </div>
      ) : leads === null && loadError ? (
        <div className="p-5">
          <EmptyState
            title="Pipeline not connected yet"
            description="Add SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in Settings, then run supabase/schema.sql once."
          />
        </div>
      ) : (
        <>
          <div className="flex divide-x divide-border overflow-x-auto">
            {BOARD_STAGES.map((stage) => (
              <div key={stage} className="w-56 shrink-0 p-4">
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
                      Empty
                    </p>
                  )}
                  {byStage[stage].map((lead) => {
                    const idx = FORWARD_STAGES.indexOf(lead.stage);
                    return (
                      <div key={lead.id} className="reveal rounded-md border border-border bg-surface-hover px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm text-foreground">{lead.name}</p>
                            {lead.deal_value != null && (
                              <p className="text-xs text-muted">{currency(lead.deal_value)}</p>
                            )}
                            <p className="text-[10px] text-muted">Added {formatDate(lead.created_at)}</p>
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
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => move(lead.id, FORWARD_STAGES[idx - 1])}
                              className="rounded border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent hover:text-accent"
                            >
                              ← Back
                            </button>
                          )}
                          {idx >= 0 && idx < FORWARD_STAGES.length - 1 && (
                            <button
                              type="button"
                              onClick={() => move(lead.id, FORWARD_STAGES[idx + 1])}
                              className="rounded border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent hover:text-accent"
                            >
                              {STAGE_META[FORWARD_STAGES[idx + 1]].title} →
                            </button>
                          )}
                          {stage !== "lost" && stage !== "closed" && (
                            <button
                              type="button"
                              onClick={() => move(lead.id, "lost")}
                              className="rounded border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-negative hover:text-negative"
                            >
                              Mark lost
                            </button>
                          )}
                          {stage === "lost" && (
                            <button
                              type="button"
                              onClick={() => move(lead.id, "lead")}
                              className="rounded border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent hover:text-accent"
                            >
                              Revive
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 divide-x divide-border border-t border-border sm:grid-cols-4">
            <ConversionStat label="Lead → Called" value={conversion.leadToCalled} />
            <ConversionStat label="Called → Booked" value={conversion.calledToBooked} />
            <ConversionStat label="Booked → Closed" value={conversion.bookedToClosed} />
            <ConversionStat label="Lost Rate" value={conversion.lostRate} tone="negative" />
          </div>
        </>
      )}
    </Card>
  );
}

function ConversionStat({ label, value, tone }: { label: string; value: number | null; tone?: "negative" }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-mono text-lg font-semibold ${tone === "negative" ? "text-negative" : "text-foreground"}`}>
        {value === null ? "—" : `${value.toFixed(0)}%`}
      </p>
    </div>
  );
}

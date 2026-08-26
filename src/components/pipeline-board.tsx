"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, inputClass, primaryButtonClass } from "@/components/ui/form-field";

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

// One consistent colour per stage — used for the column dot, the card's
// left edge, and the drop-target highlight. Called = warning (amber),
// Booked = accent (blue), Closed = positive (green), Lost = negative (red).
const STAGE_META: Record<Stage, { title: string; hint: string; dot: string; border: string; ring: string }> = {
  lead: { title: "Lead", hint: "In from Meta / Lead Distro", dot: "bg-muted", border: "border-l-muted", ring: "ring-muted/40" },
  called: { title: "Called", hint: "First contact made", dot: "bg-warning", border: "border-l-warning", ring: "ring-warning/40" },
  booked: { title: "Booked", hint: "Job/quote booked", dot: "bg-accent", border: "border-l-accent", ring: "ring-accent/40" },
  closed: { title: "Closed", hint: "Job won", dot: "bg-positive", border: "border-l-positive", ring: "ring-positive/40" },
  lost: { title: "Lost", hint: "Didn't convert", dot: "bg-negative", border: "border-l-negative", ring: "ring-negative/40" },
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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

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
        subtitle="Drag a card between columns, or use the buttons — leads land in Lead automatically from Meta / Lead Distro once connected"
      />

      <div className="border-b border-border p-6">
        <form onSubmit={addLead} className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_auto]">
          <FormField label="Lead name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Smith Solar Install"
              className={inputClass}
            />
          </FormField>
          <FormField label="Deal size (AUD)">
            <input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </FormField>
          <div className="flex items-end">
            <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full sm:w-auto`}>
              + Add lead
            </button>
          </div>
        </form>
        {loadError && <p className="mt-3 text-sm text-negative">{loadError}</p>}
      </div>

      {leads === null && !loadError ? (
        <div className="p-6">
          <EmptyState title="Loading pipeline…" description="Fetching leads from Supabase." />
        </div>
      ) : leads === null && loadError ? (
        <div className="p-6">
          <EmptyState
            title="Pipeline not connected yet"
            description="Add SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in Settings, then run supabase/schema.sql once."
          />
        </div>
      ) : (
        <>
          <div className="flex divide-x divide-border overflow-x-auto">
            {BOARD_STAGES.map((stage) => (
              <div
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage);
                }}
                onDragLeave={() => setDragOverStage((cur) => (cur === stage ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) move(id, stage);
                  setDragOverStage(null);
                }}
                className={`w-80 shrink-0 p-5 transition-colors ${
                  dragOverStage === stage ? "bg-surface-hover" : ""
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${STAGE_META[stage].dot}`} />
                    <div>
                      <p className="text-base font-semibold text-foreground">{STAGE_META[stage].title}</p>
                      <p className="text-xs text-muted">{STAGE_META[stage].hint}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-surface-hover px-2.5 py-1 text-sm font-mono text-muted">
                    {byStage[stage].length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {byStage[stage].length === 0 && (
                    <p
                      className={`rounded-lg border-2 border-dashed px-3 py-8 text-center text-sm text-muted transition-colors ${
                        dragOverStage === stage ? "border-accent" : "border-border"
                      }`}
                    >
                      Drop here
                    </p>
                  )}
                  {byStage[stage].map((lead) => {
                    const idx = FORWARD_STAGES.indexOf(lead.stage);
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", lead.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingId(lead.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOverStage(null);
                        }}
                        className={`reveal cursor-grab rounded-lg border border-border border-l-4 ${STAGE_META[stage].border} bg-surface-hover px-4 py-3.5 active:cursor-grabbing ${
                          draggingId === lead.id ? "opacity-40" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-base font-medium text-foreground">{lead.name}</p>
                            {lead.deal_value != null && (
                              <p className="text-sm text-muted">{currency(lead.deal_value)}</p>
                            )}
                            <p className="mt-0.5 text-xs text-muted">Added {formatDate(lead.created_at)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(lead.id)}
                            aria-label="Remove lead"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-base text-muted transition-colors hover:bg-negative/10 hover:text-negative"
                          >
                            ×
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => move(lead.id, FORWARD_STAGES[idx - 1])}
                              className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                            >
                              ← Back
                            </button>
                          )}
                          {idx >= 0 && idx < FORWARD_STAGES.length - 1 && (
                            <button
                              type="button"
                              onClick={() => move(lead.id, FORWARD_STAGES[idx + 1])}
                              className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                            >
                              {STAGE_META[FORWARD_STAGES[idx + 1]].title} →
                            </button>
                          )}
                          {stage !== "lost" && stage !== "closed" && (
                            <button
                              type="button"
                              onClick={() => move(lead.id, "lost")}
                              className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-negative hover:text-negative"
                            >
                              Mark lost
                            </button>
                          )}
                          {stage === "lost" && (
                            <button
                              type="button"
                              onClick={() => move(lead.id, "lead")}
                              className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
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
            <ConversionStat label="Lead → Called" value={conversion.leadToCalled} tone="warning" />
            <ConversionStat label="Called → Booked" value={conversion.calledToBooked} tone="accent" />
            <ConversionStat label="Booked → Closed" value={conversion.bookedToClosed} tone="positive" />
            <ConversionStat label="Lost Rate" value={conversion.lostRate} tone="negative" />
          </div>
        </>
      )}
    </Card>
  );
}

function ConversionStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone: "warning" | "accent" | "positive" | "negative";
}) {
  const toneClass = {
    warning: "text-warning",
    accent: "text-accent",
    positive: "text-positive",
    negative: "text-negative",
  }[tone];

  return (
    <div className="px-6 py-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${toneClass}`}>
        {value === null ? "—" : `${value.toFixed(0)}%`}
      </p>
    </div>
  );
}

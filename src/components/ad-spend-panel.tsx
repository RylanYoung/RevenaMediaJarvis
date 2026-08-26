"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, inputClass, primaryButtonClass } from "@/components/ui/form-field";
import { usePollingEffect } from "@/hooks/use-polling-effect";

type AdSpendEntry = {
  id: number;
  funnel: "b2c" | "b2b";
  campaign_name: string;
  spend_date: string;
  cost: number;
};

function currency(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function AdSpendPanel() {
  const [entries, setEntries] = useState<AdSpendEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [funnel, setFunnel] = useState<"b2c" | "b2b">("b2c");
  const [cost, setCost] = useState("");
  const [label, setLabel] = useState("");
  const [spendDate, setSpendDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/financials/ad-spend")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setEntries(json.entries);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  usePollingEffect(load);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!cost || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/financials/ad-spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funnel, cost, label, spend_date: spendDate }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to add entry");
      setEntries((prev) => [json.entry, ...(prev ?? [])]);
      setCost("");
      setLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: number) {
    setEntries((prev) => (prev ?? []).filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/financials/ad-spend/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error);
    } catch {
      load();
    }
  }

  return (
    <div>
      <form onSubmit={addEntry} className="grid grid-cols-1 gap-4 border-b border-border p-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_1fr_auto]">
        <FormField label="Funnel">
          <select
            value={funnel}
            onChange={(e) => setFunnel(e.target.value as "b2c" | "b2b")}
            className={inputClass}
          >
            <option value="b2c">B2C</option>
            <option value="b2b">B2B</option>
          </select>
        </FormField>
        <FormField label="Amount (AUD)">
          <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Label">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Meta boost spend"
            className={inputClass}
          />
        </FormField>
        <FormField label="Date">
          <input
            type="date"
            value={spendDate}
            onChange={(e) => setSpendDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <div className="flex items-end">
          <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full lg:w-auto`}>
            + Add spend
          </button>
        </div>
      </form>

      {entries === null && !error && (
        <div className="p-6">
          <EmptyState title="Loading…" description="Fetching manual ad spend entries." />
        </div>
      )}
      {error && (
        <div className="p-6">
          <EmptyState
            title="Not connected yet"
            description="Add Supabase keys in Settings to start logging ad spend here."
          />
        </div>
      )}
      {entries !== null && entries.length === 0 && !error && (
        <div className="p-6">
          <EmptyState
            title="No manual ad spend yet"
            description="Log spend here while Lead Distro / Meta aren't synced yet — it counts the same as synced spend everywhere else."
          />
        </div>
      )}
      {entries !== null && entries.length > 0 && (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-6 py-4 text-base">
              <div>
                <span className="text-foreground">{entry.campaign_name}</span>
                <span className="ml-3 rounded-full bg-surface-hover px-2.5 py-1 text-xs uppercase text-muted">
                  {entry.funnel}
                </span>
                <span className="ml-3 text-sm text-muted">{formatDate(entry.spend_date)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-lg text-foreground">{currency(entry.cost)}</span>
                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  aria-label="Remove entry"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-muted transition-colors hover:bg-negative/10 hover:text-negative"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

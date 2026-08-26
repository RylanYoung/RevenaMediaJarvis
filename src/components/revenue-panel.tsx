"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, inputClass, primaryButtonClass } from "@/components/ui/form-field";

type RevenueEntry = {
  id: string;
  amount: number;
  description: string | null;
  entry_date: string;
};

function currency(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function RevenuePanel() {
  const [entries, setEntries] = useState<RevenueEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/financials/revenue")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setEntries(json.entries);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(load, []);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/financials/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description, entry_date: entryDate }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to add entry");
      setEntries((prev) => [json.entry, ...(prev ?? [])]);
      setAmount("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    setEntries((prev) => (prev ?? []).filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/financials/revenue/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error);
    } catch {
      load();
    }
  }

  return (
    <div>
      <form onSubmit={addEntry} className="grid grid-cols-1 gap-4 border-b border-border p-6 sm:grid-cols-[1fr_2fr_1fr_auto]">
        <FormField label="Amount (AUD)">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Description">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Invoice — Excelled Electrical"
            className={inputClass}
          />
        </FormField>
        <FormField label="Date">
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <div className="flex items-end">
          <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full sm:w-auto`}>
            + Add revenue
          </button>
        </div>
      </form>

      {entries === null && !error && (
        <div className="p-6">
          <EmptyState title="Loading…" description="Fetching revenue entries." />
        </div>
      )}
      {error && (
        <div className="p-6">
          <EmptyState
            title="Not connected yet"
            description="Add Supabase keys in Settings, then run supabase/schema.sql, to start logging revenue here."
          />
        </div>
      )}
      {entries !== null && entries.length === 0 && !error && (
        <div className="p-6">
          <EmptyState
            title="No manual entries yet"
            description="Stripe and Lead Distro revenue is added automatically once synced (see the breakdown above) — this form is for anything else, like cash or bank transfer payments."
          />
        </div>
      )}
      {entries !== null && entries.length > 0 && (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-6 py-4 text-base">
              <div>
                <span className="text-foreground">{entry.description || "Revenue entry"}</span>
                <span className="ml-3 text-sm text-muted">{formatDate(entry.entry_date)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-lg text-foreground">{currency(entry.amount)}</span>
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

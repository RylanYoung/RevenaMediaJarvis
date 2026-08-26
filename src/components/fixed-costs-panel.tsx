"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";

type FixedCost = {
  id: string;
  name: string;
  monthly_amount: number;
  created_at: string;
};

function currency(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function FixedCostsPanel() {
  const [costs, setCosts] = useState<FixedCost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/financials/fixed-costs")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error);
        setCosts(json.costs);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(load, []);

  async function addCost(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/financials/fixed-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), monthly_amount: amount }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to add cost");
      setCosts((prev) => [json.cost, ...(prev ?? [])]);
      setName("");
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add cost");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    setCosts((prev) => (prev ?? []).filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/financials/fixed-costs/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error);
    } catch {
      load();
    }
  }

  const total = (costs ?? []).reduce((sum, c) => sum + Number(c.monthly_amount), 0);

  return (
    <div>
      <form onSubmit={addCost} className="flex flex-wrap items-end gap-3 border-b border-border p-5">
        <label className="flex min-w-[160px] flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lead Distro subscription"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="flex w-36 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Monthly (AUD)</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          + Add cost
        </button>
      </form>

      {costs === null && !error && (
        <div className="p-5">
          <EmptyState title="Loading…" description="Fetching fixed costs." />
        </div>
      )}
      {error && (
        <div className="p-5">
          <EmptyState
            title="Not connected yet"
            description="Add Supabase keys in Settings, then run supabase/schema.sql, to start logging fixed costs here."
          />
        </div>
      )}
      {costs !== null && costs.length === 0 && !error && (
        <div className="p-5">
          <EmptyState
            title="No fixed costs logged yet"
            description="Add recurring software costs (Lead Distro, GHL, Zapier, Stripe fees, etc.) to get an accurate margin."
          />
        </div>
      )}
      {costs !== null && costs.length > 0 && (
        <>
          <div className="divide-y divide-border">
            {costs.map((cost) => (
              <div key={cost.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <span className="text-foreground">{cost.name}</span>
                  <span className="ml-2 text-xs text-muted">since {formatDate(cost.created_at)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-foreground">{currency(cost.monthly_amount)}/mo</span>
                  <button
                    type="button"
                    onClick={() => remove(cost.id)}
                    aria-label="Remove cost"
                    className="text-muted transition-colors hover:text-negative"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
            <span className="text-muted">Total</span>
            <span className="font-mono font-medium text-foreground">{currency(total)}/mo</span>
          </div>
        </>
      )}
    </div>
  );
}

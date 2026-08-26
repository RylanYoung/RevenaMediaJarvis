import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function FinancialsPage() {
  return (
    <>
      <PageHeader
        title="Financials"
        description="Revenue, ad spend, fixed costs, margin, and profit — the true all-in picture of the business."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Revenue" value="—" hint="Installer payments (Stripe)" />
        <StatTile label="Total Expenses" value="—" hint="Ad spend + fixed costs" />
        <StatTile label="Net Profit" value="—" hint="Revenue − Expenses" />
        <StatTile label="Margin %" value="—" hint="Net Profit ÷ Revenue" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue" subtitle="Installer client payments — sourced from Stripe" />
          <div className="p-5">
            <EmptyState
              title="No revenue data yet"
              description="Stripe isn't wired up yet. Revenue will show per-client and totaled here."
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Expenses" subtitle="Ad spend (B2C + B2B) and fixed software costs" />
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-muted">B2C Ad Spend (Lead Distro)</span>
              <span className="font-mono text-foreground">—</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-muted">B2B Ad Spend (Meta)</span>
              <span className="font-mono text-foreground">—</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-muted">Fixed Software Costs</span>
              <span className="font-mono text-foreground">—</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader
            title="Fixed Monthly Costs"
            subtitle="Software subscriptions and recurring overhead — logged manually"
            action={
              <button
                type="button"
                className="rounded-md border border-border bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                + Add cost
              </button>
            }
          />
          <div className="p-5">
            <EmptyState
              title="No fixed costs logged yet"
              description="Add recurring software costs (Lead Distro, GHL, Zapier, Stripe fees, etc.) to get an accurate margin."
            />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader title="Margin Trend" subtitle="Revenue vs. total expenses over time" />
          <div className="p-5">
            <EmptyState
              title="No data yet"
              description="Populates once revenue and expense sources are connected."
            />
          </div>
        </Card>
      </div>
    </>
  );
}

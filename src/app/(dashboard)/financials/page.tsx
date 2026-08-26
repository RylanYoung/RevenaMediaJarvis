import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FinancialsSummary, ExpensesBreakdown, RevenueBreakdown } from "@/components/financials-summary";
import { RevenuePanel } from "@/components/revenue-panel";
import { FixedCostsPanel } from "@/components/fixed-costs-panel";
import { AdSpendPanel } from "@/components/ad-spend-panel";
import { SyncButton } from "@/components/sync-button";

export default function FinancialsPage() {
  return (
    <>
      <PageHeader
        title="Financials"
        description="Revenue, ad spend, fixed costs, margin, and profit — the true all-in picture of the business. Last 30 days."
      />

      <FinancialsSummary />

      <div className="mt-8">
        <SectionLabel>Revenue vs. Expenses</SectionLabel>
        <div className="reveal-group grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Revenue"
              subtitle="Stripe + Lead Distro-derived + manual entries, all added together"
              action={
                <SyncButton
                  endpoint="/api/sync/stripe"
                  body={{ days: 30 }}
                  resultField="paymentsSynced"
                  unitLabel="payment"
                  label="Sync Stripe"
                />
              }
            />
            <RevenueBreakdown />
            <RevenuePanel />
          </Card>

          <Card>
            <CardHeader title="Expenses" subtitle="B2C and B2B ad spend are tracked separately, never combined" />
            <ExpensesBreakdown />
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader
            title="Manual Ad Spend"
            subtitle="Log spend by hand for whatever isn't synced yet — same totals everywhere else once added"
          />
          <AdSpendPanel />
        </Card>
      </div>

      <div className="mt-8">
        <SectionLabel>Ad Spend Efficiency</SectionLabel>
        <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="B2C Ad Spend : Revenue" value="—" hint="B2C spend ÷ total revenue" />
          <StatTile label="B2B Ad Spend : Revenue" value="—" hint="B2B spend ÷ total revenue" />
          <StatTile label="Total Ad Spend : Revenue" value="—" hint="Combined, for reference only" />
        </div>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader title="Fixed Monthly Costs" subtitle="Software subscriptions and recurring overhead — logged manually" />
          <FixedCostsPanel />
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader
            title="Lead Package Margins"
            subtitle="Profit per lead package sold to installers, and the average margin % across packages"
            action={
              <button
                type="button"
                className="rounded-md border border-border bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                + Add package
              </button>
            }
          />
          <div className="p-5">
            <EmptyState
              title="No lead packages logged yet"
              description="Add each installer lead package (price, leads included, cost) to see profit and margin % per package."
            />
          </div>
        </Card>
      </div>

      <div className="mt-8">
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

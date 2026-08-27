import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SyncStatus } from "@/components/ui/sync-status";
import { OverviewHero } from "@/components/overview-hero";
import { B2BOverviewStats } from "@/components/b2b-metrics";
import { getFinancialsSummary } from "@/lib/financials-summary";

// Supabase reads here aren't `fetch`, so Next has no signal to treat this
// route as dynamic — without this it gets statically baked at build time.
export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  // Prefetched here (server-side, default 30D range) so the page arrives
  // with real numbers already in it instead of a blank-then-loads flash.
  // Falls back to null (client fetches as normal) if Supabase isn't set
  // up yet — this must never break the page from rendering.
  const initialSummary = await getFinancialsSummary(30).catch(() => null);

  return (
    <>
      <PageHeader
        title="Overview"
        description="B2C and B2B are tracked completely separately — no shared or blended ad spend numbers."
      />

      <OverviewHero initialSummary={initialSummary} />

      <div className="mb-6">
        <SectionLabel>B2C — SolarSavings.au (light visibility)</SectionLabel>
        <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatTile label="Cost per Lead (CPL)" value="—" hint="Lead Distro — not connected" />
          <StatTile label="Leads Sent" value="—" hint="Lead Distro — not connected" />
        </div>
      </div>

      <div className="mb-6">
        <SectionLabel>B2B — Installer Clients (full visibility)</SectionLabel>
        <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <B2BOverviewStats />
        </div>
      </div>

      <div className="reveal-group grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Revenue vs. Ad Spend vs. Margin"
            subtitle="Monthly trend — Financials"
            action={<SyncStatus />}
          />
          <div className="p-5">
            <EmptyState
              title="No data yet"
              description="Populates once Lead Distro, Meta, and manual financial entries are wired up."
            />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="B2B Pipeline Snapshot"
            subtitle="Leads → Qualified Call → Closed"
            action={<SyncStatus />}
          />
          <div className="p-5">
            <EmptyState
              title="No pipeline entries yet"
              description="Add or move leads on the B2B Pipeline page to see them here."
            />
          </div>
        </Card>
      </div>
    </>
  );
}

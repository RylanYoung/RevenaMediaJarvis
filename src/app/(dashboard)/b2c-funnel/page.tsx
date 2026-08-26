import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SyncButton } from "@/components/sync-button";

export default function B2CFunnelPage() {
  return (
    <>
      <PageHeader
        title="B2C Funnel"
        description="SolarSavings.au lead generation — sourced from Lead Distro. B2C only, never blended with B2B numbers."
      />

      <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Cost per Lead (CPL)" value="—" hint="Lead Distro" />
        <StatTile label="Leads Sent" value="—" hint="Lead Distro" />
        <StatTile label="Qualified Leads Accepted" value="—" hint="Lead Distro" />
        <StatTile label="B2C Ad Spend" value="—" hint="Lead Distro" />
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader
            title="Campaign Performance"
            subtitle="Per-campaign leads, spend, and CPL — pulled from Lead Distro into Supabase"
            action={
              <SyncButton
                endpoint="/api/sync/lead-distro"
                body={{ days: 1 }}
                resultField="leadsSynced"
                unitLabel="lead"
              />
            }
          />
          <div className="p-5">
            <EmptyState
              title="Not synced yet"
              description="Hit Sync now once LEAD_DISTRO_API_KEY and Supabase are set up in Settings — this pulls real leads and campaign performance, not estimates."
            />
          </div>
        </Card>
      </div>
    </>
  );
}

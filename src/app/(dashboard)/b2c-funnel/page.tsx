import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function B2CFunnelPage() {
  return (
    <>
      <PageHeader
        title="B2C Funnel"
        description="SolarSavings.au lead generation — sourced from Lead Distro. B2C only, never blended with B2B numbers."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Cost per Lead (CPL)" value="—" hint="Lead Distro" />
        <StatTile label="Leads Generated" value="—" hint="Lead Distro" />
        <StatTile label="Leads Sent to Buyers" value="—" hint="Lead Distro" />
        <StatTile label="B2C Ad Spend" value="—" hint="Lead Distro" />
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader
            title="Campaign Performance"
            subtitle="Per-campaign leads, spend, and CPL"
          />
          <div className="p-5">
            <EmptyState
              title="Lead Distro not connected"
              description="Add LEAD_DISTRO_API_KEY in your environment variables to pull campaign performance here — real numbers, not estimates."
            />
          </div>
        </Card>
      </div>
    </>
  );
}

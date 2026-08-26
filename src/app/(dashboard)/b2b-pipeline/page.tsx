import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PipelineBoard } from "@/components/pipeline-board";
import { SyncButton } from "@/components/sync-button";
import { B2BPipelineStats } from "@/components/b2b-metrics";

export default function B2BPipelinePage() {
  return (
    <>
      <PageHeader
        title="B2B Pipeline"
        description="Leads land automatically from Meta / Lead Distro once connected. You move them by hand through Called, Booked, Closed, or Lost."
      />

      <B2BPipelineStats />

      <div className="mt-6">
        <Card>
          <CardHeader
            title="B2B Ad Spend"
            subtitle="Daily spend from the Meta ad account — pulled into Supabase"
            action={
              <SyncButton
                endpoint="/api/sync/meta"
                body={{ days: 7 }}
                resultField="spendSynced"
                unitLabel="day"
              />
            }
          />
          <div className="p-5">
            <EmptyState
              title="Not synced yet"
              description="Hit Sync now once META_AD_ACCOUNT_ID, META_ACCESS_TOKEN, and Supabase are set up in Settings."
            />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <PipelineBoard />
      </div>

      <div className="mt-8">
        <SectionLabel>Churn</SectionLabel>
        <div className="reveal-group grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Monthly Churn Rate" value="—" hint="Clients cancelled ÷ active clients" />
          <StatTile label="Clients Churned (this month)" value="—" hint="Not connected yet" />
          <StatTile label="Avg. Leads Bought Before Churn" value="—" hint="Not connected yet" />
        </div>
      </div>
    </>
  );
}

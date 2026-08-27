import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { ClientsSummary, ClientsPanel } from "@/components/clients-panel";
import { SyncButton } from "@/components/sync-button";

export default function ClientsPage() {
  return (
    <>
      <PageHeader
        title="Clients"
        description="Every installer client — real ones synced from Lead Distro, plus anything you add by hand. Leads purchased and revenue per client, past and present."
      />

      <div className="mb-8">
        <ClientsSummary />
      </div>

      <Card>
        <CardHeader
          title="Client Roster"
          subtitle="Synced clients show their real Lead Distro name, leads bought, and revenue — manual ones are yours to fill in"
          action={
            <SyncButton
              endpoint="/api/sync/lead-distro-clients"
              resultField="clientsSynced"
              unitLabel="client"
              label="Sync Lead Distro"
            />
          }
        />
        <ClientsPanel />
      </Card>
    </>
  );
}

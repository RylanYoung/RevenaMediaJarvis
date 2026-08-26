import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { IntegrationsList, type Integration } from "@/components/integrations-list";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  const integrations: Integration[] = [
    {
      name: "Lead Distro",
      description: "B2C leads, campaign performance, and B2C ad spend — synced into Supabase via the button on B2C Funnel.",
      poweredSections: "B2C Funnel, Overview, Financials",
      envVars: [
        { key: "LEAD_DISTRO_API_KEY", connected: !!process.env.LEAD_DISTRO_API_KEY },
        { key: "LEAD_DISTRO_CAMPAIGN_ID", connected: !!process.env.LEAD_DISTRO_CAMPAIGN_ID },
      ],
    },
    {
      name: "Meta Marketing API",
      description: "B2B ad spend and B2B leads (separate ad account from B2C).",
      poweredSections: "B2B Pipeline, Overview, Financials, Growth Calculator",
      envVars: [
        { key: "META_AD_ACCOUNT_ID", connected: !!process.env.META_AD_ACCOUNT_ID },
        { key: "META_ACCESS_TOKEN", connected: !!process.env.META_ACCESS_TOKEN },
      ],
    },
    {
      name: "Stripe",
      description: "Installer client payments — the source of truth for Revenue.",
      poweredSections: "Overview, Financials",
      envVars: [{ key: "STRIPE_SECRET_KEY", connected: !!process.env.STRIPE_SECRET_KEY }],
    },
    {
      name: "Supabase",
      description: "Database for synced B2C leads/ad spend, manual pipeline entries, fixed costs, and lead packages.",
      poweredSections: "B2C Funnel sync, B2B Pipeline, Financials (persistence across sessions)",
      envVars: [
        { key: "SUPABASE_URL", connected: !!process.env.SUPABASE_URL },
        { key: "SUPABASE_ANON_KEY", connected: !!process.env.SUPABASE_ANON_KEY },
        { key: "SUPABASE_SERVICE_ROLE_KEY", connected: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
      ],
    },
    {
      name: "Dashboard Login",
      description: "The shared username/password gate on every page except this one's status check.",
      poweredSections: "Whole app",
      envVars: [
        { key: "DASHBOARD_USERNAME", connected: !!process.env.DASHBOARD_USERNAME },
        { key: "DASHBOARD_PASSWORD", connected: !!process.env.DASHBOARD_PASSWORD },
      ],
    },
  ];

  const totalVars = integrations.flatMap((i) => i.envVars).length;
  const connectedVars = integrations.flatMap((i) => i.envVars).filter((v) => v.connected).length;
  const connectedIntegrations = integrations.filter((i) => i.envVars.every((v) => v.connected)).length;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Connection status for every integration. Keys are never shown or stored here — only whether each one is set."
      />

      <div className="reveal-group mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile
          label="Integrations Connected"
          value={`${connectedIntegrations} / ${integrations.length}`}
        />
        <StatTile label="Keys Set" value={`${connectedVars} / ${totalVars}`} />
        <StatTile label="Theme" value="Dark / Light" hint="Toggle in sidebar or below" />
      </div>

      <div className="mb-8">
        <SectionLabel>Preferences</SectionLabel>
        <Card>
          <CardHeader title="Appearance" subtitle="Switch between dark and light — applies everywhere, remembered on this device" />
          <div className="p-5">
            <ThemeToggle />
          </div>
        </Card>
      </div>

      <div className="mb-8">
        <SectionLabel>Integrations</SectionLabel>
        <IntegrationsList integrations={integrations} />
      </div>

      <Card>
        <CardHeader title="How to set a key" subtitle="Same variable name, two places depending on where you're running" />
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
          <div className="bg-surface p-5">
            <p className="text-sm font-medium text-foreground">Local development</p>
            <p className="mt-1 text-xs text-muted">
              Open <code className="font-mono">.env.local</code> in the project root, paste the value after the
              `=`, save, and restart <code className="font-mono">npm run dev</code>.
            </p>
          </div>
          <div className="bg-surface p-5">
            <p className="text-sm font-medium text-foreground">Deployed on Vercel</p>
            <p className="mt-1 text-xs text-muted">
              Project → Settings → Environment Variables → add the same key/value → redeploy for it to take
              effect.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}

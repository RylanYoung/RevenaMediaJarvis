// Thin wrapper over the real Lead Distro integration (MCP — see
// lead-distro-mcp.ts) so /api/sync/lead-distro doesn't need to change.
// The REST paths this used to guess at all 404'd; the actual protocol
// is JSON-RPC over their MCP endpoint, confirmed live against the real
// account (list_buyers, get_leads, get_campaign_performance all tested
// and returned real data before this was wired up here).

import {
  getLeads,
  getCampaignPerformance,
  type LeadDistroLead,
  type CampaignPerformance,
} from "@/lib/lead-distro-mcp";

export type { LeadDistroLead };
export type LeadDistroCampaignPerformance = CampaignPerformance;

export async function fetchLeads(params: {
  campaignId: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<LeadDistroLead[]> {
  return getLeads(params);
}

export async function fetchCampaignPerformance(params: {
  campaignId: string;
  dateFrom: string;
  dateTo: string;
}): Promise<LeadDistroCampaignPerformance> {
  return getCampaignPerformance(params);
}

import { NextResponse } from "next/server";
import { fetchCampaignPerformance, fetchLeads } from "@/lib/lead-distro";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Allow a bit more headroom than the 10s Vercel Hobby default, in case
// Lead Distro is slow to respond across the day loop below.
export const maxDuration = 60;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const campaignId = process.env.LEAD_DISTRO_CAMPAIGN_ID;
    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: "LEAD_DISTRO_CAMPAIGN_ID is not set — add it in Settings / .env.local." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    // Defaults to just today (fast, safe for the button). Pass a larger
    // `days` for a one-time historical backfill — kept capped so a
    // fat-fingered value can't loop for minutes and hit a timeout.
    const days = Math.min(Math.max(Number(body.days) || 1, 1), 30);

    const supabase = getSupabaseAdmin();
    const today = new Date();
    const dateFrom = new Date(today);
    dateFrom.setDate(dateFrom.getDate() - (days - 1));

    // --- Leads ---
    const leads = await fetchLeads({
      campaignId,
      dateFrom: isoDate(dateFrom),
      dateTo: isoDate(today),
    });

    let leadsSynced = 0;
    if (leads.length > 0) {
      const rows = leads.map((lead) => ({
        id: lead.id,
        campaign_id: lead.campaign_id,
        supplier_id: lead.supplier_id,
        buyer_id: lead.buyer_id,
        status: lead.status,
        outcome: lead.outcome,
        state: lead.state,
        zip_code: lead.zip_code,
        cost: lead.cost,
        revenue: lead.revenue,
        price: lead.price,
        quality_score: lead.quality_score,
        tags: lead.tags,
        lead_created_at: lead.created_at,
        accepted_at: lead.accepted_at,
        converted_at: lead.converted_at,
        synced_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from("b2c_leads").upsert(rows, { onConflict: "id" });
      if (error) throw new Error(`Supabase b2c_leads upsert failed: ${error.message}`);
      leadsSynced = rows.length;
    }

    // --- Ad spend / campaign performance — one row per day in range ---
    const spendRows = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(dateFrom);
      d.setDate(d.getDate() + i);
      const dayStr = isoDate(d);
      const perf = await fetchCampaignPerformance({ campaignId, dateFrom: dayStr, dateTo: dayStr });
      spendRows.push({
        funnel: "b2c" as const,
        campaign_id: perf.campaign.id,
        campaign_name: perf.campaign.name,
        spend_date: dayStr,
        total_leads: perf.campaign.total_leads,
        accepted: perf.campaign.accepted,
        converted: perf.campaign.converted,
        cost: perf.campaign.cost,
        revenue: perf.campaign.revenue,
        profit: perf.campaign.profit,
        margin_pct: perf.campaign.margin_pct,
        synced_at: new Date().toISOString(),
      });
    }

    let spendSynced = 0;
    if (spendRows.length > 0) {
      const { error } = await supabase
        .from("ad_spend")
        .upsert(spendRows, { onConflict: "funnel,campaign_id,spend_date" });
      if (error) throw new Error(`Supabase ad_spend upsert failed: ${error.message}`);
      spendSynced = spendRows.length;
    }

    return NextResponse.json({
      ok: true,
      leadsSynced,
      spendSynced,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { fetchCharges, upsertCharges } from "@/lib/stripe";
import { fetchAccountName, fetchDailySpend } from "@/lib/meta-ads";
import { fetchLeads, fetchCampaignPerformance } from "@/lib/lead-distro";
import { listBuyers, getLeadBreakdownByBuyer } from "@/lib/lead-distro-mcp";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Consolidates every provider into ONE Vercel Cron job (see vercel.json).
// Vercel's free plan caps cron at 2 jobs / once per day each — running
// four separate crons wasn't an option, so this batches Stripe (backstop;
// the webhook is the real instant path), Meta, Lead Distro leads +
// campaign spend, and the Lead Distro client roster into a single daily
// run. Each provider is isolated so one failing (e.g. Meta not
// configured yet) doesn't stop the others.
export const maxDuration = 60;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function syncStripe() {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo);
  dateFrom.setDate(dateFrom.getDate() - 1); // 2-day lookback, catches anything the webhook missed
  const charges = await fetchCharges({ dateFrom, dateTo });
  return { paymentsSynced: await upsertCharges(charges) };
}

async function syncMeta() {
  if (!process.env.META_AD_ACCOUNT_ID || !process.env.META_ACCESS_TOKEN) {
    return { skipped: "META_AD_ACCOUNT_ID / META_ACCESS_TOKEN not set" };
  }
  const today = new Date();
  const dateFrom = new Date(today);
  dateFrom.setDate(dateFrom.getDate() - 6);
  const [accountName, dailySpend] = await Promise.all([
    fetchAccountName(),
    fetchDailySpend({ dateFrom: isoDate(dateFrom), dateTo: isoDate(today) }),
  ]);

  const rows = dailySpend.map((day) => ({
    funnel: "b2b" as const,
    campaign_id: process.env.META_AD_ACCOUNT_ID!,
    campaign_name: accountName,
    spend_date: day.date,
    cost: day.spend,
    synced_at: new Date().toISOString(),
  }));
  if (rows.length === 0) return { spendSynced: 0 };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("ad_spend").upsert(rows, { onConflict: "funnel,campaign_id,spend_date" });
  if (error) throw new Error(error.message);
  return { spendSynced: rows.length };
}

async function syncLeadDistroLeads() {
  const campaignId = process.env.LEAD_DISTRO_CAMPAIGN_ID;
  if (!campaignId) return { skipped: "LEAD_DISTRO_CAMPAIGN_ID not set" };

  const supabase = getSupabaseAdmin();
  const today = new Date();
  const dateFrom = new Date(today);
  dateFrom.setDate(dateFrom.getDate() - 1);

  const leads = await fetchLeads({ campaignId, dateFrom: isoDate(dateFrom), dateTo: isoDate(today) });
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
    if (error) throw new Error(`leads: ${error.message}`);
    leadsSynced = rows.length;
  }

  const dayStr = isoDate(today);
  const perf = await fetchCampaignPerformance({ campaignId, dateFrom: dayStr, dateTo: dayStr });
  const { error: spendError } = await supabase.from("ad_spend").upsert(
    [
      {
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
      },
    ],
    { onConflict: "funnel,campaign_id,spend_date" }
  );
  if (spendError) throw new Error(`spend: ${spendError.message}`);

  return { leadsSynced, spendSynced: 1 };
}

async function syncClients() {
  const [buyers, breakdown] = await Promise.all([
    listBuyers(),
    getLeadBreakdownByBuyer("2020-01-01", isoDate(new Date())),
  ]);
  const breakdownByName = new Map(breakdown.map((row) => [row.label, row]));

  const rows = buyers.map((buyer) => {
    const stats = breakdownByName.get(buyer.name);
    return {
      lead_distro_buyer_id: buyer.id,
      name: buyer.name,
      status: buyer.status === "active" ? ("active" as const) : ("past" as const),
      leads_purchased: stats?.count ?? 0,
      total_revenue: stats?.revenue ?? 0,
      source: "lead-distro" as const,
      started_at: buyer.created_at.slice(0, 10),
      synced_at: new Date().toISOString(),
    };
  });
  if (rows.length === 0) return { clientsSynced: 0 };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("clients").upsert(rows, { onConflict: "lead_distro_buyer_id" });
  if (error) throw new Error(error.message);
  return { clientsSynced: rows.length };
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const providers: Record<string, () => Promise<unknown>> = {
    stripe: syncStripe,
    meta: syncMeta,
    leadDistroLeads: syncLeadDistroLeads,
    clients: syncClients,
  };

  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const [key, fn] of Object.entries(providers)) {
    try {
      results[key] = await fn();
    } catch (err) {
      errors[key] = err instanceof Error ? err.message : "Unknown error";
    }
  }

  return NextResponse.json({ ok: true, results, errors, syncedAt: new Date().toISOString() });
}

import { NextResponse } from "next/server";
import { fetchAccountName, fetchDailySpend } from "@/lib/meta-ads";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 30;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    // Meta's insights endpoint returns one row per day in a single call
    // (time_increment=1), so unlike the Lead Distro sync there's no need
    // to loop day-by-day — a wider default range is cheap here.
    const days = Math.min(Math.max(Number(body.days) || 7, 1), 90);

    const today = new Date();
    const dateFrom = new Date(today);
    dateFrom.setDate(dateFrom.getDate() - (days - 1));

    const [accountName, dailySpend] = await Promise.all([
      fetchAccountName(),
      fetchDailySpend({ dateFrom: isoDate(dateFrom), dateTo: isoDate(today) }),
    ]);

    const adAccountId = process.env.META_AD_ACCOUNT_ID!;
    const supabase = getSupabaseAdmin();

    const rows = dailySpend.map((day) => ({
      funnel: "b2b" as const,
      campaign_id: adAccountId,
      campaign_name: accountName,
      spend_date: day.date,
      cost: day.spend,
      synced_at: new Date().toISOString(),
    }));

    let spendSynced = 0;
    if (rows.length > 0) {
      const { error } = await supabase
        .from("ad_spend")
        .upsert(rows, { onConflict: "funnel,campaign_id,spend_date" });
      if (error) throw new Error(`Supabase ad_spend upsert failed: ${error.message}`);
      spendSynced = rows.length;
    }

    return NextResponse.json({ ok: true, spendSynced, syncedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Require a minimum sample so one lucky/unlucky lead doesn't produce a
// wildly misleading conversion rate.
const MIN_SAMPLE = 3;

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 29);

    const [leadsRes, spendRes] = await Promise.all([
      supabase.from("b2b_leads").select("stage, deal_value"),
      supabase
        .from("ad_spend")
        .select("cost")
        .eq("funnel", "b2b")
        .gte("spend_date", dateFrom.toISOString().slice(0, 10)),
    ]);
    if (leadsRes.error) throw new Error(leadsRes.error.message);
    if (spendRes.error) throw new Error(spendRes.error.message);

    const leads = leadsRes.data ?? [];
    const total = leads.length;
    const called = leads.filter((l) => ["called", "booked", "closed"].includes(l.stage)).length;
    const booked = leads.filter((l) => ["booked", "closed"].includes(l.stage)).length;
    const closed = leads.filter((l) => l.stage === "closed").length;

    const closedWithValue = leads.filter((l) => l.stage === "closed" && l.deal_value != null);
    const avgDealValue =
      closedWithValue.length > 0
        ? closedWithValue.reduce((sum, l) => sum + Number(l.deal_value), 0) / closedWithValue.length
        : null;

    const totalSpend = (spendRes.data ?? []).reduce((sum, r) => sum + Number(r.cost || 0), 0);
    const costPerLead = total > 0 && totalSpend > 0 ? totalSpend / total : null;

    return NextResponse.json({
      ok: true,
      hasData: total >= MIN_SAMPLE,
      sampleSize: total,
      avgDealValue,
      costPerLead,
      leadToCalled: total >= MIN_SAMPLE ? (called / total) * 100 : null,
      calledToBooked: called >= MIN_SAMPLE ? (booked / called) * 100 : null,
      bookedToClosed: booked >= MIN_SAMPLE ? (closed / booked) * 100 : null,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

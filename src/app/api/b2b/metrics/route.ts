import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(Number(searchParams.get("days")) || 30, 1), 365);

    const dateTo = new Date();
    const dateFrom = new Date(dateTo);
    dateFrom.setDate(dateFrom.getDate() - (days - 1));
    const dateFromStr = dateFrom.toISOString().slice(0, 10);
    const dateToStr = dateTo.toISOString().slice(0, 10);

    const supabase = getSupabaseAdmin();

    const [leadsRes, spendRes, clientsRes] = await Promise.all([
      supabase.from("b2b_leads").select("stage, deal_value"),
      supabase
        .from("ad_spend")
        .select("cost")
        .eq("funnel", "b2b")
        .gte("spend_date", dateFromStr)
        .lte("spend_date", dateToStr),
      supabase.from("clients").select("status, churned_at, leads_purchased"),
    ]);
    if (leadsRes.error) throw new Error(leadsRes.error.message);
    if (spendRes.error) throw new Error(spendRes.error.message);
    if (clientsRes.error) throw new Error(clientsRes.error.message);

    const leads = leadsRes.data ?? [];
    const totalLeads = leads.length;
    const calledCount = leads.filter((l) => ["called", "booked", "closed"].includes(l.stage)).length;
    const bookedCount = leads.filter((l) => ["booked", "closed"].includes(l.stage)).length;
    const closedCount = leads.filter((l) => l.stage === "closed").length;
    const lostCount = leads.filter((l) => l.stage === "lost").length;

    const closedWithValue = leads.filter((l) => l.stage === "closed" && l.deal_value != null);
    const avgDealSize =
      closedWithValue.length > 0
        ? closedWithValue.reduce((sum, l) => sum + Number(l.deal_value), 0) / closedWithValue.length
        : null;

    const totalB2BSpend = (spendRes.data ?? []).reduce((sum, r) => sum + Number(r.cost || 0), 0);

    // Real client roster (Clients page) — Active Clients and Churn Rate now
    // come from here instead of being a b2b_leads proxy / static placeholder.
    const clients = clientsRes.data ?? [];
    const activeClients = clients.filter((c) => c.status === "active").length;
    const churnedInWindow = clients.filter(
      (c) => c.status === "past" && c.churned_at && new Date(c.churned_at) >= dateFrom
    ).length;
    const churnBase = activeClients + churnedInWindow;
    const churnedClients = clients.filter((c) => c.status === "past");
    const avgLeadsBeforeChurn =
      churnedClients.length > 0
        ? churnedClients.reduce((sum, c) => sum + Number(c.leads_purchased || 0), 0) / churnedClients.length
        : null;

    return NextResponse.json({
      ok: true,
      dateFrom: dateFromStr,
      dateTo: dateToStr,
      totalLeads,
      calledCount,
      bookedCount,
      closedCount,
      lostCount,
      avgDealSize,
      totalB2BSpend,
      cpl: totalLeads > 0 ? totalB2BSpend / totalLeads : null,
      cac: closedCount > 0 ? totalB2BSpend / closedCount : null,
      leadToCalledPct: totalLeads > 0 ? (calledCount / totalLeads) * 100 : null,
      calledToBookedPct: calledCount > 0 ? (bookedCount / calledCount) * 100 : null,
      bookedToClosedPct: bookedCount > 0 ? (closedCount / bookedCount) * 100 : null,
      lostRatePct: totalLeads > 0 ? (lostCount / totalLeads) * 100 : null,
      hasClientData: clients.length > 0,
      activeClients,
      churnedInWindow,
      churnRatePct: churnBase > 0 ? (churnedInWindow / churnBase) * 100 : null,
      avgLeadsBeforeChurn,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

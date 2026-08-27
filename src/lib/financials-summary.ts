import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type FinancialsSummary = {
  dateFrom: string;
  dateTo: string;
  leadDistroRevenue: number;
  manualRevenue: number;
  stripeRevenue: number;
  totalRevenue: number;
  b2cSpend: number;
  b2bSpend: number;
  fixedCostsMonthly: number;
  fixedCostsProrated: number;
  totalExpenses: number;
  profit: number;
  marginPct: number | null;
};

// Shared by /api/financials/summary (client-side polling) and the Overview
// / Financials pages (server-side prefetch on first load) — one place for
// the math so the two never drift apart.
export async function getFinancialsSummary(daysInput: number): Promise<FinancialsSummary> {
  const days = Math.min(Math.max(daysInput || 30, 1), 365);

  const dateTo = new Date();
  const dateFrom = new Date(dateTo);
  dateFrom.setDate(dateFrom.getDate() - (days - 1));
  const dateFromStr = dateFrom.toISOString().slice(0, 10);
  const dateToStr = dateTo.toISOString().slice(0, 10);

  const supabase = getSupabaseAdmin();

  const [leadsRes, revenueRes, stripeRes, adSpendRes, fixedCostsRes] = await Promise.all([
    supabase.from("b2c_leads").select("revenue").gte("lead_created_at", dateFromStr),
    supabase.from("revenue_entries").select("amount").gte("entry_date", dateFromStr).lte("entry_date", dateToStr),
    supabase
      .from("stripe_payments")
      .select("amount")
      .eq("refunded", false)
      .gte("paid_at", dateFromStr)
      .lte("paid_at", dateToStr),
    supabase.from("ad_spend").select("funnel, cost").gte("spend_date", dateFromStr).lte("spend_date", dateToStr),
    supabase.from("fixed_costs").select("monthly_amount"),
  ]);

  for (const res of [leadsRes, revenueRes, stripeRes, adSpendRes, fixedCostsRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const leadDistroRevenue = (leadsRes.data ?? []).reduce((sum, r) => sum + Number(r.revenue || 0), 0);
  const manualRevenue = (revenueRes.data ?? []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const stripeRevenue = (stripeRes.data ?? []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalRevenue = leadDistroRevenue + manualRevenue + stripeRevenue;

  const b2cSpend = (adSpendRes.data ?? [])
    .filter((r) => r.funnel === "b2c")
    .reduce((sum, r) => sum + Number(r.cost || 0), 0);
  const b2bSpend = (adSpendRes.data ?? [])
    .filter((r) => r.funnel === "b2b")
    .reduce((sum, r) => sum + Number(r.cost || 0), 0);

  const fixedCostsMonthly = (fixedCostsRes.data ?? []).reduce((sum, r) => sum + Number(r.monthly_amount || 0), 0);
  const fixedCostsProrated = fixedCostsMonthly * (days / 30);

  const totalExpenses = b2cSpend + b2bSpend + fixedCostsProrated;
  const profit = totalRevenue - totalExpenses;
  const marginPct = totalRevenue > 0 ? (profit / totalRevenue) * 100 : null;

  return {
    dateFrom: dateFromStr,
    dateTo: dateToStr,
    leadDistroRevenue,
    manualRevenue,
    stripeRevenue,
    totalRevenue,
    b2cSpend,
    b2bSpend,
    fixedCostsMonthly,
    fixedCostsProrated,
    totalExpenses,
    profit,
    marginPct,
  };
}

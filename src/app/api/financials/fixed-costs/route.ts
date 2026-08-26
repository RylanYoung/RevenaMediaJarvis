import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("fixed_costs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, costs: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const monthlyAmount = Number(body.monthly_amount);
    if (!name || !isFinite(monthlyAmount) || monthlyAmount < 0) {
      return NextResponse.json({ ok: false, error: "Name and a valid monthly amount are required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("fixed_costs")
      .insert({ name, monthly_amount: monthlyAmount })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, cost: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

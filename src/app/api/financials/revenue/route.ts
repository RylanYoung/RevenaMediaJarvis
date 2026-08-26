import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("revenue_entries")
      .select("*")
      .order("entry_date", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, entries: data });
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
    const amount = Number(body.amount);
    if (!isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "A valid amount is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("revenue_entries")
      .insert({
        amount,
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        entry_date: body.entry_date || new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, entry: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

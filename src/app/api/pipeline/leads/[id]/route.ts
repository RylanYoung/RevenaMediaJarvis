import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const VALID_STAGES = ["lead", "called", "booked", "closed", "lost"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const stage = body.stage;
    if (typeof stage !== "string" || !VALID_STAGES.includes(stage)) {
      return NextResponse.json({ ok: false, error: "Invalid stage." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("b2b_leads")
      .update({
        stage,
        updated_at: new Date().toISOString(),
        ...(stage === "closed" ? { closed_at: new Date().toISOString() } : {}),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, lead: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("b2b_leads").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

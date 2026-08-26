// Stripe client — verified live against the real account. Charges here
// flow through GoHighLevel invoicing (see charge.metadata.invoiceNumber),
// but the Charges API captures the money regardless of what created it.

import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BASE_URL = "https://api.stripe.com/v1";

function requireKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set — add it in Settings / .env.local.");
  }
  return key;
}

function authHeader(key: string) {
  return { Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}` };
}

export type StripeCharge = {
  id: string;
  amount: number; // cents
  currency: string;
  customer: string | null;
  description: string | null;
  status: string;
  refunded: boolean;
  paid: boolean;
  created: number; // unix seconds
};

export async function fetchCharges(params: { dateFrom: Date; dateTo: Date }): Promise<StripeCharge[]> {
  const key = requireKey();
  const charges: StripeCharge[] = [];
  let startingAfter: string | undefined;
  const gte = Math.floor(params.dateFrom.getTime() / 1000);
  const lte = Math.floor(params.dateTo.getTime() / 1000);

  // Paginate through everything in range — Stripe caps each page at 100.
  for (let page = 0; page < 20; page++) {
    const url = new URL(`${BASE_URL}/charges`);
    url.searchParams.set("limit", "100");
    url.searchParams.set("created[gte]", String(gte));
    url.searchParams.set("created[lte]", String(lte));
    if (startingAfter) url.searchParams.set("starting_after", startingAfter);

    const res = await fetch(url, { headers: authHeader(key) });
    if (!res.ok) {
      throw new Error(`Stripe charges request failed: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    charges.push(...json.data);
    if (!json.has_more || json.data.length === 0) break;
    startingAfter = json.data[json.data.length - 1].id;
  }

  return charges;
}

// Shared by the polling sync route and the instant webhook — same mapping,
// same idempotent upsert (keyed on Stripe's own charge id) either way.
export async function upsertCharges(charges: StripeCharge[]): Promise<number> {
  const paid = charges.filter((c) => c.paid); // only money that actually landed
  if (paid.length === 0) return 0;

  const rows = paid.map((c) => ({
    id: c.id,
    amount: c.amount / 100,
    currency: c.currency,
    customer_id: c.customer,
    description: c.description,
    status: c.status,
    refunded: c.refunded,
    paid_at: new Date(c.created * 1000).toISOString(),
    synced_at: new Date().toISOString(),
  }));

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("stripe_payments").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Supabase stripe_payments upsert failed: ${error.message}`);
  return rows.length;
}

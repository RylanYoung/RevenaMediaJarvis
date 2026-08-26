import { NextResponse } from "next/server";
import Stripe from "stripe";
import { upsertCharges, type StripeCharge } from "@/lib/stripe";

export const maxDuration = 30;

// Stripe calls this the instant a payment lands — the real "instant sync,"
// as opposed to the daily cron (safety net) or the manual button (backfill).
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !stripeKey) {
    return NextResponse.json(
      { ok: false, error: "STRIPE_WEBHOOK_SECRET / STRIPE_SECRET_KEY not set." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = new Stripe(stripeKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Signature verification failed: ${err instanceof Error ? err.message : err}` },
      { status: 400 }
    );
  }

  // Any of these carry a full Charge object in data.object — same shape
  // the polling sync uses, so the same upsert handles all of them.
  const CHARGE_EVENTS = ["charge.succeeded", "charge.updated", "charge.refunded"];
  if (!CHARGE_EVENTS.includes(event.type)) {
    return NextResponse.json({ ok: true, skipped: event.type });
  }

  try {
    const charge = event.data.object as Stripe.Charge;
    const mapped: StripeCharge = {
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      customer: typeof charge.customer === "string" ? charge.customer : (charge.customer?.id ?? null),
      description: charge.description,
      status: charge.status,
      refunded: charge.refunded,
      paid: charge.paid,
      created: charge.created,
    };

    const paymentsSynced = await upsertCharges([mapped]);
    return NextResponse.json({ ok: true, paymentsSynced });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

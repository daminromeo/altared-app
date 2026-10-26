import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { PASS_STRIPE_PRICE_ID, PLANS } from "@/lib/stripe/config";
import { getUserAccess } from "@/lib/plan-access";
import type Stripe from "stripe";

/** Starts a one-time Stripe Checkout for the Wedding Pass. */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { access } = await getUserAccess(supabase, user.id);
    if (access.source === "pass" || access.source === "subscription") {
      return NextResponse.json(
        { error: "You already have full access. There's nothing to buy." },
        { status: 409 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      // Billing columns are server-only (migration 009), so write with the
      // service role
      await createAdminClient()
        .from("profiles")
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = PASS_STRIPE_PRICE_ID
      ? { price: PASS_STRIPE_PRICE_ID, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(PLANS.pass.price * 100),
            product_data: {
              name: "Altared Wedding Pass",
              description: PLANS.pass.description,
            },
          },
          quantity: 1,
        };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const metadata = { userId: user.id, product: "wedding_pass" };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      mode: "payment",
      line_items: [lineItem],
      success_url: `${appUrl}/dashboard?pass=active`,
      cancel_url: `${appUrl}/settings?tab=billing&canceled=true`,
      metadata,
      payment_intent_data: { metadata },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("POST /api/stripe/checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

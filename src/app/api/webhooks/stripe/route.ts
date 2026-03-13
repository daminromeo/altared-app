import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripe();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(
        "Stripe webhook signature verification failed:",
        err instanceof Error ? err.message : err
      );
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          // Determine plan from the subscription's price ID
          let plan = "pro"; // fallback
          if (subscriptionId) {
            const stripe = getStripe();
            const subscription =
              await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0]?.price?.id;
            if (priceId) {
              const premiumMonthly =
                process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID;
              const premiumYearly =
                process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID;
              if (
                priceId === premiumMonthly ||
                priceId === premiumYearly
              ) {
                plan = "premium";
              }
            }
          }

          const { error } = await supabase
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              subscription_status: plan,
              subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (error) {
            console.error("Error updating profile after checkout:", error);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        // Determine plan from price
        const priceId = subscription.items.data[0]?.price?.id;
        let plan = "free";
        if (priceId) {
          const proMonthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
          const proYearly = process.env.STRIPE_PRO_YEARLY_PRICE_ID;
          const premiumMonthly = process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID;
          const premiumYearly = process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID;

          if (priceId === proMonthly || priceId === proYearly) {
            plan = "pro";
          } else if (priceId === premiumMonthly || priceId === premiumYearly) {
            plan = "premium";
          }
        }

        const isActive = status === "active" || status === "trialing";

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_status: isActive ? plan : "free",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error(
            "Error updating profile on subscription update:",
            error
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_status: "free",
            subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error(
            "Error updating profile on subscription deletion:",
            error
          );
        }
        break;
      }

      default:
        // Unhandled event type — just acknowledge
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("POST /api/webhooks/stripe error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

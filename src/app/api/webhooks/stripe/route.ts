import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { trackTikTokEvent } from "@/lib/tiktok/events";
import { passExpiryAtPurchase } from "@/lib/plan-access";
import {
  notifyNewSubscription,
  notifySubscriptionCanceled,
  notifySubscriptionCancelScheduled,
  notifySubscriptionUpdated,
} from "@/lib/slack/notify";

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
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "payment") {
          if (session.payment_status === "paid") await grantWeddingPass(session);
          break;
        }
        if (event.type !== "checkout.session.completed") break;

        // Legacy monthly subscription checkout (before the Wedding Pass)
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

          // Fire TikTok Purchase event
          const amount = session.amount_total
            ? session.amount_total / 100
            : plan === "premium" ? 19.99 : 9.99;
          const customerEmail =
            session.customer_details?.email ?? undefined;

          trackTikTokEvent({
            event: "PlaceAnOrder",
            email: customerEmail,
            value: amount,
            currency: "USD",
            contentId: plan,
            contentName: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
          });

          await notifyNewSubscription({
            email: customerEmail,
            plan,
            amount,
            currency: session.currency ?? "USD",
          });
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

        // Only notify on actual plan changes — skip renewal-only updates that
        // don't touch `items` (price). previous_attributes is populated by
        // Stripe with the diff of what changed.
        const prev =
          (event.data as { previous_attributes?: Record<string, unknown> })
            .previous_attributes ?? {};
        const planChanged = "items" in prev;
        // Canceling in the billing portal schedules the cancellation for the
        // end of the period — that's an update, not a deletion.
        const cancelScheduled =
          ("cancel_at_period_end" in prev || "cancel_at" in prev) &&
          (subscription.cancel_at_period_end || subscription.cancel_at !== null);
        if (planChanged || cancelScheduled) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          if (cancelScheduled) {
            await notifySubscriptionCancelScheduled({
              email: profile?.email,
              plan,
              cancelAt: subscription.cancel_at,
            });
          } else {
            await notifySubscriptionUpdated({
              email: profile?.email,
              plan: isActive ? plan : "free",
              status,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

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

        await notifySubscriptionCanceled({ email: profile?.email });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        // Only a full refund ends the pass; partial refunds are goodwill credits
        if (!charge.refunded || typeof charge.customer !== "string") break;

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_status: "free",
            pass_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", charge.customer)
          .eq("subscription_status", "pass");
        if (error) console.error("Error revoking Wedding Pass after refund:", error);
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

/** Marks the buyer's profile as holding a Wedding Pass. Safe to run twice. */
async function grantWeddingPass(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId ?? session.client_reference_id;
  if (!userId || session.metadata?.product !== "wedding_pass") return;

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("wedding_date, email")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_customer_id: session.customer as string,
      subscription_status: "pass",
      pass_expires_at: passExpiryAtPurchase(profile?.wedding_date ?? null).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error granting Wedding Pass:", error);
    throw error; // 500 so Stripe retries the event
  }

  const amount = session.amount_total ? session.amount_total / 100 : null;
  const email = session.customer_details?.email ?? profile?.email ?? undefined;

  trackTikTokEvent({
    event: "PlaceAnOrder",
    email,
    value: amount ?? undefined,
    currency: "USD",
    contentId: "wedding_pass",
    contentName: "Wedding Pass",
  });

  await notifyNewSubscription({
    email,
    plan: "Wedding Pass",
    amount,
    currency: session.currency ?? "USD",
  });
}

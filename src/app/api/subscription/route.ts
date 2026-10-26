import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { getUserAccess } from "@/lib/plan-access";
import type Stripe from "stripe";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { access, plan } = await getUserAccess(supabase, user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_id, stripe_customer_id")
      .eq("id", user.id)
      .single();

    // Infinity is not JSON-serializable (becomes null), so replace with
    // a large sentinel number for the client to interpret as "unlimited".
    const finite = (n: number) => (Number.isFinite(n) ? n : 999999);
    const serializablePlan = {
      ...plan,
      limits: {
        ...plan.limits,
        vendors: finite(plan.limits.vendors),
        proposalScans: finite(plan.limits.proposalScans),
        reminders: finite(plan.limits.reminders),
      },
    };

    // Legacy monthly subscribers: surface renewal/cancellation state
    let status: string | null = null;
    let currentPeriodEnd: string | null = null;
    let cancelAtPeriodEnd = false;

    if (access.source === "subscription" && profile?.subscription_id) {
      try {
        const sub = (await stripe.subscriptions.retrieve(
          profile.subscription_id
        )) as Stripe.Subscription;
        status = sub.status;
        cancelAtPeriodEnd = sub.cancel_at_period_end;
        // In Stripe v20+, current_period_end is on subscription items
        const firstItem = sub.items?.data?.[0];
        if (firstItem?.current_period_end) {
          currentPeriodEnd = new Date(firstItem.current_period_end * 1000).toISOString();
        }
      } catch {
        // Subscription may have been deleted — fall back to defaults
      }
    }

    return NextResponse.json({
      planId: access.planId,
      plan: serializablePlan,
      access,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      stripeCustomerId: profile?.stripe_customer_id ?? null,
    });
  } catch (err) {
    console.error("GET /api/subscription error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

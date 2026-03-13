import { stripe } from "./client";
import { getPlanByPriceId } from "./config";
import type Stripe from "stripe";

interface CreateCheckoutParams {
  userId: string;
  email: string;
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckoutSession({
  userId,
  email,
  priceId,
  successUrl,
  cancelUrl,
}: CreateCheckoutParams): Promise<Stripe.Checkout.Session> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    client_reference_id: userId,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url:
      successUrl ?? `${appUrl}/dashboard/settings/billing?success=true`,
    cancel_url:
      cancelUrl ?? `${appUrl}/dashboard/settings/billing?canceled=true`,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
    allow_promotion_codes: true,
  });

  return session;
}

interface CreatePortalParams {
  customerId: string;
  returnUrl?: string;
}

export async function createPortalSession({
  customerId,
  returnUrl,
}: CreatePortalParams): Promise<Stripe.BillingPortal.Session> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl ?? `${appUrl}/dashboard/settings/billing`,
  });

  return session;
}

export interface SubscriptionStatus {
  isActive: boolean;
  planId: string;
  status: Stripe.Subscription.Status | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  customerId: string | null;
}

export async function getSubscriptionStatus(
  customerId: string | null
): Promise<SubscriptionStatus> {
  const defaultStatus: SubscriptionStatus = {
    isActive: false,
    planId: "free",
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    customerId,
  };

  if (!customerId) {
    return defaultStatus;
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
      expand: ["data.items.data.price"],
    });

    const subscription = subscriptions.data[0];

    if (!subscription) {
      return defaultStatus;
    }

    const priceId = subscription.items.data[0]?.price?.id;
    const plan = priceId ? getPlanByPriceId(priceId) : null;

    const isActive =
      subscription.status === "active" ||
      subscription.status === "trialing";

    return {
      isActive,
      planId: plan?.id ?? "free",
      status: subscription.status,
      currentPeriodEnd: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      customerId,
    };
  } catch {
    return defaultStatus;
  }
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PLANS, type SubscriptionPlan } from "@/lib/stripe/config";

const SUBSCRIPTION_KEY = "subscription";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Feature gate definitions ──────────────────────────────────────────────────

type Feature =
  | "comparison_scoring"
  | "comparison_ai"
  | "reminders"
  | "partner_sharing";

const FEATURE_PLAN_MAP: Record<Feature, SubscriptionPlan["id"][]> = {
  comparison_scoring: ["pro", "premium"],
  comparison_ai: ["pro", "premium"],
  reminders: ["pro", "premium"],
  partner_sharing: ["pro", "premium"],
};

const COMPARISON_VENDOR_LIMITS: Record<SubscriptionPlan["id"], number> = {
  free: 2,
  pro: 4,
  premium: 4,
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubscriptionData {
  planId: string;
  plan: SubscriptionPlan;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

interface CheckoutParams {
  priceId: string;
}

interface CheckoutResult {
  url: string;
}

interface PortalResult {
  url: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Returns the current subscription plan, features, and limits.
 */
export function useSubscription() {
  const query = useQuery<SubscriptionData>({
    queryKey: [SUBSCRIPTION_KEY],
    queryFn: () => fetchJson<SubscriptionData>("/api/subscription"),
    staleTime: 60_000,
  });

  const plan = query.data?.plan ?? PLANS.free;
  const planId = (query.data?.planId ?? "free") as SubscriptionPlan["id"];

  /**
   * Checks if the current subscription plan allows a given feature.
   */
  function canUseFeature(feature: Feature): boolean {
    const allowedPlans = FEATURE_PLAN_MAP[feature];
    if (!allowedPlans) return false;
    return allowedPlans.includes(planId);
  }

  function getComparisonVendorLimit(): number {
    return COMPARISON_VENDOR_LIMITS[planId] ?? 2;
  }

  return {
    ...query,
    plan,
    planId,
    canUseFeature,
    getComparisonVendorLimit,
    isFreePlan: planId === "free",
    isProPlan: planId === "pro",
    isPremiumPlan: planId === "premium",
  };
}

/**
 * Creates a Stripe checkout session and redirects the user.
 */
export function useCheckout() {
  return useMutation<CheckoutResult, Error, CheckoutParams>({
    mutationFn: (params) =>
      fetchJson<CheckoutResult>("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

/**
 * Creates a Stripe billing portal session and redirects the user.
 */
export function usePortalSession() {
  return useMutation<PortalResult, Error, void>({
    mutationFn: () =>
      fetchJson<PortalResult>("/api/stripe/portal", {
        method: "POST",
      }),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

export type { Feature };

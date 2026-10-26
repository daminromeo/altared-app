import { useQuery, useMutation } from "@tanstack/react-query";
import { PLANS, type Plan } from "@/lib/stripe/config";
import { trialDaysLeft, type Access } from "@/lib/plan-access";
import { trackEvent } from "@/lib/analytics";

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

// Every paid feature comes with the Wedding Pass (and the free trial).
type Feature =
  | "comparison_scoring"
  | "comparison_ai"
  | "reminders"
  | "partner_sharing"
  | "proposal_scanning";

const COMPARISON_VENDOR_LIMITS: Record<Plan["id"], number> = {
  free: 2,
  pass: 4,
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubscriptionData {
  planId: Plan["id"];
  plan: Plan;
  access: Access;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

interface CheckoutResult {
  url: string;
}

interface PortalResult {
  url: string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Returns the current plan, how the couple has it (trial, pass, legacy
 * subscription), and feature limits.
 */
export function useSubscription() {
  const query = useQuery<SubscriptionData>({
    queryKey: [SUBSCRIPTION_KEY],
    queryFn: () => fetchJson<SubscriptionData>("/api/subscription"),
    staleTime: 60_000,
  });

  const plan = query.data?.plan ?? PLANS.free;
  const planId = query.data?.planId ?? "free";
  const access = query.data?.access ?? null;

  function canUseFeature(feature: Feature): boolean {
    void feature;
    return planId === "pass";
  }

  function getComparisonVendorLimit(): number {
    return COMPARISON_VENDOR_LIMITS[planId] ?? 2;
  }

  return {
    ...query,
    plan,
    planId,
    access,
    canUseFeature,
    getComparisonVendorLimit,
    isFreePlan: planId === "free",
    isTrial: access?.source === "trial",
    /** Paid through a pass or a legacy subscription (not the trial) */
    hasPaidAccess: access?.source === "pass" || access?.source === "subscription",
    trialDaysLeft: access ? trialDaysLeft(access) : 0,
    /** True once a trial existed and has run out */
    trialEnded: access?.source === "free" && !!access.trialEndsAt,
  };
}

/**
 * Starts Stripe Checkout for the Wedding Pass and redirects the user.
 * `location` says which prompt started it, for the funnel.
 */
export function useCheckout() {
  return useMutation<CheckoutResult, Error, { location: string } | void>({
    mutationFn: (params) => {
      trackEvent("checkout_started", { product: "wedding_pass", location: params?.location ?? "unknown" });
      return fetchJson<CheckoutResult>("/api/stripe/checkout", { method: "POST" });
    },
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

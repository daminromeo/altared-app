// Altared sells one product: the Wedding Pass, a one-time payment that unlocks
// the app through the couple's wedding. Every account gets TRIAL_DAYS free, no
// card required; after that the app is locked (their data is kept) until they
// buy the pass. Who has access right now is decided by resolveAccess() in
// src/lib/plan-access.ts.

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: "free" | "pass";
  name: string;
  description: string;
  /** One-time price in USD */
  price: number;
  features: PlanFeature[];
  limits: {
    vendors: number;
    /** Completed AI scans per calendar month */
    proposalScans: number;
    reminders: number;
    storageGB: number;
  };
}

export const TRIAL_DAYS = 14;

/** The day the Wedding Pass and the trial shipped. Accounts from then on start their trial at signup. */
export const TRIAL_LAUNCH_DATE = "2026-10-26";

/**
 * Accounts created before TRIAL_LAUNCH_DATE were on the old Free plan. Their
 * trial starts here instead of at signup, so they get the same 14 days' notice
 * before the app locks.
 */
export const LEGACY_TRIAL_START = "2026-10-27";

/** The pass lasts at least this long after purchase… */
export const PASS_MIN_MONTHS = 18;
/** …and is extended to this many days after the wedding date when that's later. */
export const PASS_DAYS_AFTER_WEDDING = 30;

export const PLANS: Record<Plan["id"], Plan> = {
  free: {
    id: "free",
    // No longer offered: these limits apply only to API calls from locked
    // accounts, which the app itself doesn't let through.
    name: "Free",
    description: "Locked until the Wedding Pass",
    price: 0,
    features: [
      { text: "Up to 10 vendors", included: true },
      { text: "Budget tracking", included: true },
      { text: "Compare 2 vendors side by side", included: true },
      { text: "Enter quotes by hand", included: true },
      { text: "Weighted scoring & AI recommendations", included: false },
      { text: "Share with your partner", included: false },
      { text: "AI quote scanning", included: false },
      { text: "Text your planner", included: false },
    ],
    limits: {
      vendors: 10,
      proposalScans: 0,
      reminders: 0,
      storageGB: 0.5,
    },
  },
  pass: {
    id: "pass",
    name: "Wedding Pass",
    description: "Pay once. Use everything through your wedding.",
    price: 49,
    features: [
      { text: "Text your planner: quotes, budget, tasks", included: true },
      { text: "Unlimited vendors", included: true },
      { text: "Budget tracking by category", included: true },
      { text: "Compare up to 4 vendors side by side", included: true },
      { text: "Weighted scoring & AI recommendations", included: true },
      { text: "Share with your partner, with reactions", included: true },
      { text: "AI quote scanning", included: true },
      { text: "Task and deposit reminders by email", included: true },
    ],
    limits: {
      vendors: Infinity,
      proposalScans: Infinity,
      reminders: Infinity,
      storageGB: 50,
    },
  },
};

export function getPlan(planId: string): Plan {
  return PLANS[planId as Plan["id"]] ?? PLANS.free;
}

/** Optional: a Stripe Price for the pass. Without one, checkout prices it inline. */
export const PASS_STRIPE_PRICE_ID = process.env.STRIPE_PASS_PRICE_ID ?? "";

/** Monthly prices from before the Wedding Pass, kept to recognise existing subscribers. */
export const LEGACY_SUBSCRIPTION_PRICE_IDS = {
  pro: [process.env.STRIPE_PRO_MONTHLY_PRICE_ID, process.env.STRIPE_PRO_YEARLY_PRICE_ID],
  premium: [
    process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
  ],
};

// Altared sells one product: the Wedding Pass, a one-time payment that unlocks
// every paid feature through the couple's wedding. New accounts get the same
// access free for TRIAL_DAYS, no card required. Who has access right now is
// decided by resolveAccess() in src/lib/plan-access.ts.

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

/**
 * Accounts created before this date predate the trial and don't get one.
 * Set it to the day the Wedding Pass ships.
 */
export const TRIAL_LAUNCH_DATE = "2026-10-26";

/** The pass lasts at least this long after purchase… */
export const PASS_MIN_MONTHS = 18;
/** …and is extended to this many days after the wedding date when that's later. */
export const PASS_DAYS_AFTER_WEDDING = 30;

export const PLANS: Record<Plan["id"], Plan> = {
  free: {
    id: "free",
    name: "Free",
    description: "The basics for keeping vendors and budget in one place",
    price: 0,
    features: [
      { text: "Up to 10 vendors", included: true },
      { text: "Budget tracking", included: true },
      { text: "Compare 2 vendors side by side", included: true },
      { text: "Enter quotes by hand", included: true },
      { text: "Weighted scoring & AI recommendations", included: false },
      { text: "Share with your partner", included: false },
      { text: "AI quote scanning", included: false },
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

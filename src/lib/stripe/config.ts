export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: "free" | "pro" | "premium";
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  features: PlanFeature[];
  limits: {
    vendors: number;
    proposalScans: number;
    reminders: number;
    storageGB: number;
  };
}

export const PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    description: "Get started with basic vendor management",
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: "",
    stripePriceIdYearly: "",
    features: [
      { text: "Up to 10 vendors", included: true },
      { text: "Basic budget tracking", included: true },
      { text: "Basic vendor comparison (2 vendors)", included: true },
      { text: "Manual proposal entry", included: true },
      { text: "Smart scoring & AI recommendations", included: false },
      { text: "Collaborative sharing", included: false },
      { text: "AI proposal scanning", included: false },
      { text: "Priority support", included: false },
    ],
    limits: {
      vendors: 10,
      proposalScans: 0,
      reminders: 0,
      storageGB: 0.5,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Everything you need to manage your wedding vendors",
    priceMonthly: 9.99,
    priceYearly: 99,
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID ?? process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
    features: [
      { text: "Up to 50 vendors", included: true },
      { text: "Full budget tracking", included: true },
      { text: "Advanced vendor comparison (4 vendors)", included: true },
      { text: "Weighted scoring & AI recommendations", included: true },
      { text: "Collaborative sharing & reactions", included: true },
      { text: "10 AI proposal scans / month", included: true },
      { text: "Unlimited email reminders", included: true },
      { text: "Priority support", included: false },
    ],
    limits: {
      vendors: 50,
      proposalScans: 10,
      reminders: Infinity,
      storageGB: 5,
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    description: "Unlimited access with premium features",
    priceMonthly: 19.99,
    priceYearly: 199,
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? "",
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID ?? process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID ?? "",
    features: [
      { text: "Unlimited vendors", included: true },
      { text: "Full budget tracking", included: true },
      { text: "Advanced vendor comparison (4 vendors)", included: true },
      { text: "Weighted scoring & AI recommendations", included: true },
      { text: "Collaborative sharing & reactions", included: true },
      { text: "Unlimited AI proposal scans", included: true },
      { text: "Priority support", included: true },
    ],
    limits: {
      vendors: Infinity,
      proposalScans: Infinity,
      reminders: Infinity,
      storageGB: 50,
    },
  },
};

export function getPlan(planId: string): SubscriptionPlan {
  return PLANS[planId] ?? PLANS.free;
}

export function getPlanByPriceId(priceId: string): SubscriptionPlan | null {
  return (
    Object.values(PLANS).find(
      (plan) =>
        plan.stripePriceIdMonthly === priceId ||
        plan.stripePriceIdYearly === priceId
    ) ?? null
  );
}

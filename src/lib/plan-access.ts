// Decides what a couple can use right now. Shared by API routes (which
// enforce limits) and the client (which shows trial banners and upgrade
// prompts), so both always agree.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PASS_DAYS_AFTER_WEDDING,
  PASS_MIN_MONTHS,
  TRIAL_DAYS,
  TRIAL_LAUNCH_DATE,
  getPlan,
  type Plan,
} from "@/lib/stripe/config";

/** Where the couple's access comes from. */
export type AccessSource = "free" | "trial" | "pass" | "subscription";

export interface AccessProfile {
  subscription_status: string | null;
  created_at: string | null;
  pass_expires_at: string | null;
  wedding_date: string | null;
}

export const ACCESS_PROFILE_COLUMNS =
  "subscription_status, created_at, pass_expires_at, wedding_date";

export interface Access {
  planId: Plan["id"];
  source: AccessSource;
  /** When the free trial ends (or ended); null for accounts without one */
  trialEndsAt: string | null;
  /** When pass access ends; null unless source is "pass" */
  accessEndsAt: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Pass expiry stored at purchase: PASS_MIN_MONTHS out, or later for a later wedding. */
export function passExpiryAtPurchase(weddingDate: string | null, now = new Date()): Date {
  const minimum = new Date(now);
  minimum.setMonth(minimum.getMonth() + PASS_MIN_MONTHS);
  const afterWedding = weddingDate
    ? addDays(new Date(`${weddingDate}T12:00:00Z`), PASS_DAYS_AFTER_WEDDING)
    : null;
  return afterWedding && afterWedding > minimum ? afterWedding : minimum;
}

export function resolveAccess(profile: AccessProfile | null, now = new Date()): Access {
  const status = profile?.subscription_status ?? "free";
  const createdAt = profile?.created_at ? new Date(profile.created_at) : null;
  const trialEnd =
    createdAt && createdAt >= new Date(`${TRIAL_LAUNCH_DATE}T00:00:00Z`)
      ? addDays(createdAt, TRIAL_DAYS)
      : null;
  const trialEndsAt = trialEnd?.toISOString() ?? null;

  // Monthly subscribers from before the pass keep full access while subscribed
  if (status === "pro" || status === "premium") {
    return { planId: "pass", source: "subscription", trialEndsAt, accessEndsAt: null };
  }

  if (status === "pass" && profile?.pass_expires_at) {
    // A wedding date moved later after purchase extends the pass with it
    let end = new Date(profile.pass_expires_at);
    if (profile.wedding_date) {
      const afterWedding = addDays(
        new Date(`${profile.wedding_date}T12:00:00Z`),
        PASS_DAYS_AFTER_WEDDING
      );
      if (afterWedding > end) end = afterWedding;
    }
    if (now < end) {
      return { planId: "pass", source: "pass", trialEndsAt, accessEndsAt: end.toISOString() };
    }
  }

  if (trialEnd && now < trialEnd) {
    return { planId: "pass", source: "trial", trialEndsAt, accessEndsAt: null };
  }

  return { planId: "free", source: "free", trialEndsAt, accessEndsAt: null };
}

/** Whole days left in the trial, rounded up; 0 once it has ended. */
export function trialDaysLeft(access: Access, now = new Date()): number {
  if (access.source !== "trial" || !access.trialEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(access.trialEndsAt).getTime() - now.getTime()) / DAY_MS));
}

/** Loads the signed-in user's access for an API route. */
export async function getUserAccess(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select(ACCESS_PROFILE_COLUMNS)
    .eq("id", userId)
    .single<AccessProfile>();

  const access = resolveAccess(profile);
  return { access, plan: getPlan(access.planId) };
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "damin.romeo@gmail.com";

export async function GET() {
  // Verify the requesting user is admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Fetch all data in parallel
  const [
    profilesResult,
    vendorsResult,
    proposalsResult,
    remindersResult,
    partnerLinksResult,
  ] = await Promise.all([
    admin.from("profiles").select("id, email, full_name, subscription_status, onboarding_completed, created_at, wedding_date, estimated_guest_count, total_budget, stripe_customer_id"),
    admin.from("vendors").select("id, user_id, status, is_booked, created_at"),
    admin.from("proposals").select("id, user_id, scan_status, created_at"),
    admin.from("reminders").select("id, user_id, is_completed, created_at"),
    admin.from("partner_share_links").select("id, user_id, is_active, created_at"),
  ]);

  const profiles = profilesResult.data ?? [];
  const vendors = vendorsResult.data ?? [];
  const proposals = proposalsResult.data ?? [];
  const reminders = remindersResult.data ?? [];
  const partnerLinks = partnerLinksResult.data ?? [];

  // --- Overview metrics ---
  const totalUsers = profiles.length;
  const completedOnboarding = profiles.filter((p) => p.onboarding_completed).length;

  // Subscription breakdown
  const subscriptionBreakdown = {
    free: profiles.filter((p) => p.subscription_status === "free").length,
    pro: profiles.filter((p) => p.subscription_status === "pro").length,
    premium: profiles.filter((p) => p.subscription_status === "premium").length,
  };

  // MRR estimate
  const mrr = subscriptionBreakdown.pro * 9.99 + subscriptionBreakdown.premium * 19.99;

  // --- Signups over time (last 30 days, daily) ---
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const signupsByDay: Record<string, number> = {};
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    signupsByDay[d.toISOString().split("T")[0]] = 0;
  }
  for (const p of profiles) {
    const day = p.created_at.split("T")[0];
    if (signupsByDay[day] !== undefined) {
      signupsByDay[day]++;
    }
  }

  // --- Engagement metrics ---
  const totalVendors = vendors.length;
  const bookedVendors = vendors.filter((v) => v.is_booked).length;
  const totalProposals = proposals.length;
  const scannedProposals = proposals.filter((p) => p.scan_status === "completed").length;
  const totalTasks = reminders.length;
  const completedTasks = reminders.filter((r) => r.is_completed).length;
  const totalPartnerShares = partnerLinks.length;
  const activePartnerShares = partnerLinks.filter((l) => l.is_active).length;

  // --- Per-user stats for user table ---
  const userVendorCounts: Record<string, number> = {};
  const userProposalCounts: Record<string, number> = {};
  const userTaskCounts: Record<string, number> = {};
  for (const v of vendors) {
    userVendorCounts[v.user_id] = (userVendorCounts[v.user_id] ?? 0) + 1;
  }
  for (const p of proposals) {
    userProposalCounts[p.user_id] = (userProposalCounts[p.user_id] ?? 0) + 1;
  }
  for (const r of reminders) {
    userTaskCounts[r.user_id] = (userTaskCounts[r.user_id] ?? 0) + 1;
  }

  const users = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    subscription_status: p.subscription_status,
    onboarding_completed: p.onboarding_completed,
    created_at: p.created_at,
    wedding_date: p.wedding_date,
    estimated_guest_count: p.estimated_guest_count,
    total_budget: p.total_budget,
    has_stripe: !!p.stripe_customer_id,
    vendor_count: userVendorCounts[p.id] ?? 0,
    proposal_count: userProposalCounts[p.id] ?? 0,
    task_count: userTaskCounts[p.id] ?? 0,
  }));

  return NextResponse.json({
    overview: {
      totalUsers,
      completedOnboarding,
      subscriptionBreakdown,
      mrr,
    },
    signupsByDay,
    engagement: {
      totalVendors,
      bookedVendors,
      totalProposals,
      scannedProposals,
      totalTasks,
      completedTasks,
      totalPartnerShares,
      activePartnerShares,
    },
    users,
  });
}

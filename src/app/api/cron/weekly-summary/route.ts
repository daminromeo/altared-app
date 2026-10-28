import { ACCESS_PROFILE_COLUMNS, resolveAccess } from "@/lib/plan-access";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWeeklySummary } from "@/lib/resend/templates";

export const runtime = "nodejs";
export const maxDuration = 60;

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get("authorization");
  return secret === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role to query all users
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Couples with weekly_summary on. Couples who text their planner get
  // check-ins instead, and a locked account has nothing to come back to yet.
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(`id, email, full_name, total_budget, notification_preferences, ${ACCESS_PROFILE_COLUMNS}`)
    .not("email", "is", null)
    .is("text_phone", null);

  if (profilesError || !profiles) {
    console.error("Failed to fetch profiles:", profilesError);
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }

  const eligibleProfiles = profiles.filter((p) => {
    if (resolveAccess(p).locked) return false;
    const prefs = p.notification_preferences as Record<string, boolean> | null;
    return prefs?.weekly_summary !== false; // default to true
  });

  let sent = 0;
  let errors = 0;

  for (const profile of eligibleProfiles) {
    try {
      // Fetch vendor stats
      const { data: vendors } = await supabase
        .from("vendors")
        .select("id, name, status, is_booked, created_at")
        .eq("user_id", profile.id);

      const vendorCount = vendors?.length ?? 0;
      const bookedCount = vendors?.filter((v) => v.is_booked).length ?? 0;

      // Fetch budget data
      const { data: budgetItems } = await supabase
        .from("budget_items")
        .select("actual_cost, estimated_cost")
        .eq("user_id", profile.id);

      const totalSpent = budgetItems?.reduce((sum, item) => sum + (Number(item.actual_cost) || 0), 0) ?? 0;
      const totalBudget = Number(profile.total_budget) || 0;

      // Fetch upcoming deadlines (deposits due in next 14 days)
      const now = new Date();
      const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const { data: vendorsWithDeposits } = await supabase
        .from("vendors")
        .select("name, deposit_amount, deposit_due_date, deposit_paid")
        .eq("user_id", profile.id)
        .eq("deposit_paid", false)
        .not("deposit_due_date", "is", null)
        .lte("deposit_due_date", twoWeeksOut.toISOString().split("T")[0])
        .gte("deposit_due_date", now.toISOString().split("T")[0]);

      const upcomingDeadlines = (vendorsWithDeposits ?? []).map((v) => ({
        vendorName: v.name,
        description: "Deposit",
        dueDate: v.deposit_due_date,
        amount: Number(v.deposit_amount) || undefined,
      }));

      // Also include budget items with due dates
      const { data: upcomingBudgetItems } = await supabase
        .from("budget_items")
        .select("description, due_date, actual_cost, is_paid")
        .eq("user_id", profile.id)
        .eq("is_paid", false)
        .not("due_date", "is", null)
        .lte("due_date", twoWeeksOut.toISOString().split("T")[0])
        .gte("due_date", now.toISOString().split("T")[0]);

      for (const item of upcomingBudgetItems ?? []) {
        upcomingDeadlines.push({
          vendorName: item.description,
          description: "Payment",
          dueDate: item.due_date,
          amount: Number(item.actual_cost) || undefined,
        });
      }

      // Open tasks due in the next two weeks (no longer emailed one by one)
      const { data: upcomingTasks } = await supabase
        .from("reminders")
        .select("title, due_date, vendors(name)")
        .eq("user_id", profile.id)
        .eq("is_completed", false)
        .gte("due_date", now.toISOString())
        .lte("due_date", twoWeeksOut.toISOString());

      for (const task of upcomingTasks ?? []) {
        const vendor = task.vendors as unknown as { name: string } | null;
        upcomingDeadlines.push({
          vendorName: task.title,
          description: vendor?.name ?? "Task",
          dueDate: task.due_date.slice(0, 10),
          amount: undefined,
        });
      }

      // Recent vendor activity (added/updated in last 7 days)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentVendors = (vendors ?? [])
        .filter((v) => new Date(v.created_at) >= oneWeekAgo)
        .slice(0, 5)
        .map((v) => ({
          name: v.name,
          status: v.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        }));

      // Only send when there's something to tell them
      if (upcomingDeadlines.length === 0 && recentVendors.length === 0) {
        continue;
      }
      upcomingDeadlines.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      upcomingDeadlines.splice(8);

      await sendWeeklySummary({
        to: profile.email,
        name: profile.full_name?.split(" ")[0] || "there",
        vendorCount,
        bookedCount,
        totalBudget,
        totalSpent,
        upcomingDeadlines,
        recentVendors,
      });

      sent++;
    } catch (err) {
      console.error(`Failed to send weekly summary to ${profile.email}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    sent,
    errors,
    eligible: eligibleProfiles.length,
  });
}

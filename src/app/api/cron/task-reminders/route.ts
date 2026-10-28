import { ACCESS_PROFILE_COLUMNS, resolveAccess } from "@/lib/plan-access";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTaskReminder } from "@/lib/resend/templates";

export const runtime = "nodejs";
export const maxDuration = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

// Payments only (vendor deposits and budget lines with a due date): each is
// emailed twice at most, a week ahead and the day before. Tasks aren't
// emailed one by one; the weekly summary lists the ones coming up.
const REMIND_AT_DAYS = [7, 1];

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get("authorization");
  return secret === `Bearer ${process.env.CRON_SECRET}`;
}

/** Whole days from today (UTC) to a YYYY-MM-DD or ISO date. */
function daysUntil(date: string, today: string) {
  return Math.round(
    (Date.parse(`${date.slice(0, 10)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS
  );
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Reminders are a paid feature: pass holders, trial users and legacy
  // subscribers who have task_reminders enabled. Trial access is computed from
  // created_at, so the filter runs here rather than in the query. Couples who
  // text their planner hear about these by text instead (text-checkins).
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(`id, email, full_name, notification_preferences, text_phone, ${ACCESS_PROFILE_COLUMNS}`)
    .not("email", "is", null)
    .is("text_phone", null);

  if (profilesError || !profiles) {
    console.error("Failed to fetch profiles:", profilesError);
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }

  const eligibleProfiles = profiles.filter((p) => {
    if (resolveAccess(p).planId === "free") return false;
    const prefs = p.notification_preferences as Record<string, boolean> | null;
    return prefs?.task_reminders !== false; // default to true
  });

  let sent = 0;
  let errors = 0;

  const today = new Date().toISOString().slice(0, 10);
  const remindDates = REMIND_AT_DAYS.map((d) =>
    new Date(Date.parse(`${today}T00:00:00Z`) + d * DAY_MS).toISOString().slice(0, 10)
  );

  for (const profile of eligibleProfiles) {
    try {
      const tasks: Parameters<typeof sendTaskReminder>[0]["tasks"] = [];

      // Unpaid vendor deposits
      const { data: vendorsWithDeposits } = await supabase
        .from("vendors")
        .select("name, deposit_amount, deposit_due_date")
        .eq("user_id", profile.id)
        .eq("deposit_paid", false)
        .in("deposit_due_date", remindDates);

      for (const vendor of vendorsWithDeposits ?? []) {
        tasks.push({
          vendorName: vendor.name,
          description: "Deposit",
          dueDate: vendor.deposit_due_date,
          daysUntilDue: daysUntil(vendor.deposit_due_date, today),
          amount: Number(vendor.deposit_amount) || undefined,
          isPayment: true,
        });
      }

      // Unpaid budget lines with a due date
      const { data: budgetItems } = await supabase
        .from("budget_items")
        .select("description, due_date, actual_cost, estimated_cost")
        .eq("user_id", profile.id)
        .eq("is_paid", false)
        .in("due_date", remindDates);

      for (const item of budgetItems ?? []) {
        tasks.push({
          vendorName: item.description,
          description: "Payment",
          dueDate: item.due_date,
          daysUntilDue: daysUntil(item.due_date, today),
          amount: Number(item.actual_cost) || Number(item.estimated_cost) || undefined,
          isPayment: true,
        });
      }

      if (tasks.length === 0) continue;

      // Soonest first
      tasks.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

      await sendTaskReminder({
        to: profile.email,
        name: profile.full_name?.split(" ")[0] || "there",
        tasks,
      });

      sent++;
    } catch (err) {
      console.error(`Failed to send task reminder to ${profile.email}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    sent,
    errors,
    eligible: eligibleProfiles.length,
  });
}

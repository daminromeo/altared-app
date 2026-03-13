import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTaskReminder } from "@/lib/resend/templates";

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get Pro/Premium users who have task_reminders enabled (reminders are a paid feature)
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name, notification_preferences, subscription_status")
    .not("email", "is", null)
    .in("subscription_status", ["pro", "premium"]);

  if (profilesError || !profiles) {
    console.error("Failed to fetch profiles:", profilesError);
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }

  const eligibleProfiles = profiles.filter((p) => {
    const prefs = p.notification_preferences as Record<string, boolean> | null;
    return prefs?.task_reminders !== false; // default to true
  });

  let sent = 0;
  let errors = 0;

  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const profile of eligibleProfiles) {
    try {
      const tasks: Array<{
        vendorName: string;
        description: string;
        dueDate: string;
        daysUntilDue: number;
        amount?: number;
      }> = [];

      // Find vendors with unpaid deposits due within 7 days
      const { data: vendorsWithDeposits } = await supabase
        .from("vendors")
        .select("name, deposit_amount, deposit_due_date")
        .eq("user_id", profile.id)
        .eq("deposit_paid", false)
        .not("deposit_due_date", "is", null)
        .lte("deposit_due_date", sevenDaysOut.toISOString().split("T")[0])
        .gte("deposit_due_date", now.toISOString().split("T")[0]);

      for (const vendor of vendorsWithDeposits ?? []) {
        const dueDate = new Date(vendor.deposit_due_date);
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        tasks.push({
          vendorName: vendor.name,
          description: "Deposit payment due",
          dueDate: dueDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          daysUntilDue,
          amount: Number(vendor.deposit_amount) || undefined,
        });
      }

      // Find budget items with due dates within 7 days
      const { data: budgetItems } = await supabase
        .from("budget_items")
        .select("description, due_date, actual_cost, estimated_cost")
        .eq("user_id", profile.id)
        .eq("is_paid", false)
        .not("due_date", "is", null)
        .lte("due_date", sevenDaysOut.toISOString().split("T")[0])
        .gte("due_date", now.toISOString().split("T")[0]);

      for (const item of budgetItems ?? []) {
        const dueDate = new Date(item.due_date);
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        tasks.push({
          vendorName: item.description,
          description: "Payment due",
          dueDate: dueDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          daysUntilDue,
          amount: Number(item.actual_cost) || Number(item.estimated_cost) || undefined,
        });
      }

      // Find reminders due within 7 days
      const { data: reminders } = await supabase
        .from("reminders")
        .select("title, description, due_date, vendor_id, vendors(name)")
        .eq("user_id", profile.id)
        .eq("is_completed", false)
        .lte("due_date", sevenDaysOut.toISOString())
        .gte("due_date", now.toISOString());

      for (const reminder of reminders ?? []) {
        const dueDate = new Date(reminder.due_date);
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const vendorData = reminder.vendors as unknown as { name: string } | null;
        tasks.push({
          vendorName: vendorData?.name || "General",
          description: reminder.title + (reminder.description ? ` — ${reminder.description}` : ""),
          dueDate: dueDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          daysUntilDue,
        });
      }

      // Only send if there are tasks to report
      if (tasks.length === 0) continue;

      // Sort by urgency (soonest first)
      tasks.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

      await sendTaskReminder({
        to: profile.email,
        name: profile.full_name || "there",
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

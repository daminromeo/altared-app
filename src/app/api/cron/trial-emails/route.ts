import { resolveAccess, trialDaysLeft, type AccessProfile } from "@/lib/plan-access";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTrialEnding } from "@/lib/resend/templates";
import { PLANS } from "@/lib/stripe/config";

export const runtime = "nodejs";
export const maxDuration = 60;

// Day 10 of 14 (four days left) and day 13 (last full day). Each is sent once
// per account, recorded in profiles.trial_emails_sent (migration 011).
const STAGES = [
  { id: "day10", whenDaysLeft: 4 },
  { id: "day13", whenDaysLeft: 1 },
] as const;

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

  // '*' so a missing column is detectable below rather than failing the query
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .not("email", "is", null);

  if (profilesError || !profiles) {
    console.error("Failed to fetch profiles:", profilesError);
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }
  if (profiles.length > 0 && !("trial_emails_sent" in profiles[0])) {
    // Without the record, every run would resend; send nothing instead
    return NextResponse.json({ error: "Run migration 011 first" }, { status: 500 });
  }

  let sent = 0;
  let errors = 0;

  for (const profile of profiles) {
    const access = resolveAccess(profile as AccessProfile);
    if (access.source !== "trial" || !access.trialEndsAt) continue;

    const daysLeft = trialDaysLeft(access);
    const already: string[] = profile.trial_emails_sent ?? [];
    // The latest stage that's due and not yet sent; a missed day-10 email is
    // skipped rather than sent alongside day 13
    const stage = [...STAGES].reverse().find((s) => daysLeft <= s.whenDaysLeft);
    if (!stage || already.includes(stage.id)) continue;

    try {
      // Claim the stage first, so an overlapping run can't send it too
      const { data: claimed } = await supabase
        .from("profiles")
        .update({ trial_emails_sent: [...already, stage.id] })
        .eq("id", profile.id)
        .not("trial_emails_sent", "cs", `{${stage.id}}`)
        .select("id");
      if (!claimed?.length) continue;

      const count = (table: string) =>
        supabase.from(table).select("id", { count: "exact", head: true }).eq("user_id", profile.id);
      const [vendors, quotes, tasks] = await Promise.all([
        count("vendors"),
        count("proposals"),
        count("reminders").eq("is_completed", false),
      ]);

      // Resend reports failures in the result rather than throwing
      const { error: sendError } = await sendTrialEnding({
        to: profile.email,
        name: profile.full_name?.split(" ")[0] || "there",
        stage: stage.id,
        trialEndsAt: access.trialEndsAt,
        price: PLANS.pass.price,
        vendorCount: vendors.count ?? 0,
        quoteCount: quotes.count ?? 0,
        openTaskCount: tasks.count ?? 0,
      });
      if (sendError) throw sendError;
      sent++;
    } catch (err) {
      console.error(`Trial email failed for ${profile.id}:`, err);
      errors++;
      // Release the claim so tomorrow's run tries again
      await supabase.from("profiles").update({ trial_emails_sent: already }).eq("id", profile.id);
    }
  }

  return NextResponse.json({ sent, errors });
}

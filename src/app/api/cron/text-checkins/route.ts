import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACCESS_PROFILE_COLUMNS, resolveAccess } from "@/lib/plan-access";
import { getConversationHistory, sendText } from "@/lib/hello/client";
import {
  DAYS_AFTER_UNANSWERED,
  MIN_DAYS_BETWEEN_CHECKINS,
  QUIET_HOURS_AFTER_INBOUND,
  gatherCandidates,
  writeCheckin,
  type CheckinProfile,
} from "@/lib/hello/checkins";

export const runtime = "nodejs";
export const maxDuration = 300;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get("authorization");
  return secret === `Bearer ${process.env.CRON_SECRET}`;
}

// Daily: for each couple who texts their planner, maybe send one personal
// check-in. ?dry=1 writes the texts and returns them without sending.
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = request.nextUrl.searchParams.get("dry") === "1";

  const supabase = createAdminClient();
  const now = new Date();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      `id, full_name, partner_name, wedding_date, wedding_date_estimate, wedding_location, estimated_guest_count, total_budget, planned_categories, notification_preferences, text_phone, text_conversation_id, text_last_inbound_at, ${ACCESS_PROFILE_COLUMNS}`
    )
    .not("text_phone", "is", null);

  if (error || !profiles) {
    console.error("Failed to fetch texting profiles:", error);
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }

  const results: { userId: string; outcome: string; message?: string }[] = [];

  for (const profile of profiles) {
    try {
      const prefs = profile.notification_preferences as Record<string, boolean> | null;
      if (prefs?.text_checkins === false || resolveAccess(profile).locked) continue;

      const lastInbound = profile.text_last_inbound_at ? new Date(profile.text_last_inbound_at) : null;
      if (lastInbound && now.getTime() - lastInbound.getTime() < QUIET_HOURS_AFTER_INBOUND * HOUR_MS) {
        results.push({ userId: profile.id, outcome: "mid-conversation" });
        continue;
      }

      const { data: past } = await supabase
        .from("text_checkins")
        .select("subject_key, sent_at")
        .eq("user_id", profile.id)
        .order("sent_at", { ascending: false });

      const last = past?.[0];
      if (last) {
        const since = now.getTime() - new Date(last.sent_at).getTime();
        const answered = lastInbound && lastInbound > new Date(last.sent_at);
        const wait = (answered ? MIN_DAYS_BETWEEN_CHECKINS : DAYS_AFTER_UNANSWERED) * DAY_MS;
        if (since < wait) {
          results.push({ userId: profile.id, outcome: "too-soon" });
          continue;
        }
      }

      const candidates = await gatherCandidates(
        supabase,
        profile as CheckinProfile,
        new Set((past ?? []).map((p) => p.subject_key)),
        now
      );
      if (candidates.length === 0) {
        results.push({ userId: profile.id, outcome: "nothing-to-ask" });
        continue;
      }

      const history = profile.text_conversation_id
        ? await getConversationHistory(profile.text_conversation_id)
        : [];
      const checkin = await writeCheckin(profile as CheckinProfile, candidates, history, now);
      if (!checkin) {
        results.push({ userId: profile.id, outcome: "skipped-by-planner" });
        continue;
      }

      if (dryRun) {
        results.push({ userId: profile.id, outcome: `dry-run:${checkin.subject_key}`, message: checkin.message });
        continue;
      }

      // Record first: the unique index stops a doubled run from texting twice
      const { error: insertError } = await supabase.from("text_checkins").insert({
        user_id: profile.id,
        subject_key: checkin.subject_key,
        body: checkin.message,
      });
      if (insertError) {
        results.push({ userId: profile.id, outcome: "already-sent" });
        continue;
      }

      try {
        await sendText(profile.text_phone!, checkin.message);
      } catch (sendError) {
        await supabase
          .from("text_checkins")
          .delete()
          .eq("user_id", profile.id)
          .eq("subject_key", checkin.subject_key);
        throw sendError;
      }
      results.push({ userId: profile.id, outcome: `sent:${checkin.subject_key}` });
    } catch (err) {
      console.error(`Text check-in failed for ${profile.id}:`, err);
      results.push({ userId: profile.id, outcome: "error" });
    }
  }

  return NextResponse.json({
    dryRun,
    sent: results.filter((r) => r.outcome.startsWith("sent")).length,
    results,
  });
}

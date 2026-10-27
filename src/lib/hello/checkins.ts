// Check-ins: the planner texting first, the way a person who knows the
// couple's plans would ("how did the call with the DJ go?"), not a reminder
// blast. Each run gathers a few specific moments from the couple's data and
// lets the model pick at most one worth texting about, or none.

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAnthropic } from "@/lib/anthropic/client";
import type { Database } from "@/lib/types/database";
import type { HistoryMessage } from "./client";

type Admin = SupabaseClient<Database>;

const MODEL = "claude-sonnet-5-5";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Never text more often than this */
export const MIN_DAYS_BETWEEN_CHECKINS = 3;
/** After an unanswered check-in, wait this long before another */
export const DAYS_AFTER_UNANSWERED = 7;
/** Don't interrupt a conversation that's happening */
export const QUIET_HOURS_AFTER_INBOUND = 12;

export interface CheckinCandidate {
  /** Unique per subject, e.g. task:<id>; a subject is only ever checked in on once */
  subject_key: string;
  kind:
    | "task_added_by_text"
    | "task_just_due"
    | "vendor_conversation"
    | "quote_waiting"
    | "category_not_started";
  detail: string;
}

export interface CheckinProfile {
  id: string;
  full_name: string | null;
  partner_name: string | null;
  wedding_date: string | null;
  wedding_date_estimate: string | null;
  wedding_location: string | null;
  estimated_guest_count: number | null;
  total_budget: number | null;
  planned_categories: string[] | null;
}

function daysAgo(iso: string, now: Date) {
  return Math.round((now.getTime() - new Date(iso).getTime()) / DAY_MS);
}

function when(iso: string, now: Date) {
  const days = daysAgo(iso, now);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

const STATUS_LABELS: Record<string, string> = {
  contacted: "reached out to them",
  meeting_scheduled: "set up a meeting or call with them",
};

/** Specific things worth asking about, skipping ones already brought up. */
export async function gatherCandidates(
  db: Admin,
  profile: CheckinProfile,
  alreadyAsked: Set<string>,
  now = new Date()
): Promise<CheckinCandidate[]> {
  const userId = profile.id;
  const since = (days: number) => new Date(now.getTime() - days * DAY_MS).toISOString();

  const [tasks, vendors, proposals, categories] = await Promise.all([
    db
      .from("reminders")
      .select("id, title, due_date")
      .eq("user_id", userId)
      .eq("is_completed", false)
      .gte("due_date", since(3))
      .lte("due_date", now.toISOString())
      .limit(20),
    db
      .from("vendors")
      .select("id, name, status, updated_at, category_id")
      .eq("user_id", userId),
    db
      .from("proposals")
      .select("id, created_at, extracted_total_price, vendor_id, vendors(id, name, is_booked, status)")
      .eq("user_id", userId)
      .gte("created_at", since(14))
      .lte("created_at", since(4)),
    db
      .from("vendor_categories")
      .select("id, name")
      .or(`user_id.is.null,user_id.eq.${userId}`),
  ]);

  const candidates: CheckinCandidate[] = [];
  const add = (c: CheckinCandidate) => {
    if (!alreadyAsked.has(c.subject_key) && !candidates.some((x) => x.subject_key === c.subject_key)) {
      candidates.push(c);
    }
  };

  // Tasks they added by text a few days ago, and tasks that just came due
  const textTasks = await db
    .from("reminders")
    .select("id, title, due_date, created_at")
    .eq("user_id", userId)
    .eq("is_completed", false)
    .eq("created_via", "text")
    .gte("created_at", since(10))
    .lte("created_at", since(2));
  for (const t of textTasks.data ?? []) {
    add({
      subject_key: `task:${t.id}`,
      kind: "task_added_by_text",
      detail: `They texted you to add "${t.title}" ${when(t.created_at, now)} (due ${t.due_date.slice(0, 10)}). Not marked done yet.`,
    });
  }
  for (const t of tasks.data ?? []) {
    const overdueDays = daysAgo(t.due_date, now);
    if (overdueDays < 0 || overdueDays > 3) continue;
    add({
      subject_key: `task:${t.id}`,
      kind: "task_just_due",
      detail: `"${t.title}" was due ${when(t.due_date, now)} and isn't marked done.`,
    });
  }

  // Vendors they were in the middle of talking to
  for (const v of vendors.data ?? []) {
    if (!STATUS_LABELS[v.status]) continue;
    const days = daysAgo(v.updated_at, now);
    if (days < 2 || days > 10) continue;
    add({
      subject_key: `vendor:${v.id}`,
      kind: "vendor_conversation",
      detail: `${days} days ago they ${STATUS_LABELS[v.status]}: ${v.name}. Nothing updated since.`,
    });
  }

  // Quotes that came in but haven't turned into a decision
  for (const p of proposals.data ?? []) {
    const vendor = p.vendors as { id: string; name: string; is_booked: boolean; status: string } | null;
    if (!vendor || vendor.is_booked || vendor.status === "declined") continue;
    add({
      subject_key: `vendor:${vendor.id}`,
      kind: "quote_waiting",
      detail: `They got a quote from ${vendor.name}${
        p.extracted_total_price ? ` ($${p.extracted_total_price})` : ""
      } ${when(p.created_at, now)} and haven't booked or passed on them.`,
    });
  }

  // Categories they plan to book but haven't started on
  const categoryNames = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const startedCategories = new Set(
    (vendors.data ?? []).map((v) => v.category_id && categoryNames.get(v.category_id)).filter(Boolean)
  );
  const weddingDate = profile.wedding_date ?? profile.wedding_date_estimate;
  for (const name of profile.planned_categories ?? []) {
    if (startedCategories.has(name)) continue;
    add({
      subject_key: `category:${name}`,
      kind: "category_not_started",
      detail: `They plan to book ${name} but haven't added any ${name} vendors yet.${
        weddingDate ? ` Wedding is ${Math.round(-daysAgo(weddingDate, now) / 30)} months out.` : ""
      } Only worth raising if it's about time to start on it.`,
    });
  }

  return candidates;
}

const CHECKIN_TOOL: Anthropic.Tool = {
  name: "send_checkin",
  description: "Text the couple one check-in, or skip if nothing is worth it today.",
  input_schema: {
    type: "object",
    properties: {
      subject_key: {
        type: ["string", "null"],
        description: "The subject_key of the moment you're texting about, or null to skip",
      },
      message: { type: "string", description: "The text to send. Empty when skipping." },
    },
    required: ["subject_key", "message"],
  },
};

/** Picks one moment and writes the text, or returns null to stay quiet. */
export async function writeCheckin(
  profile: CheckinProfile,
  candidates: CheckinCandidate[],
  history: HistoryMessage[],
  now = new Date()
): Promise<{ subject_key: string; message: string } | null> {
  if (candidates.length === 0) return null;

  const weddingDate = profile.wedding_date ?? profile.wedding_date_estimate;
  const about = [
    profile.full_name && `Name: ${profile.full_name}`,
    profile.partner_name && `Partner: ${profile.partner_name}`,
    weddingDate && `Wedding date: ${weddingDate}${profile.wedding_date ? "" : " (estimate)"}`,
    profile.wedding_location && `Location: ${profile.wedding_location}`,
    profile.estimated_guest_count && `Guests: about ${profile.estimated_guest_count}`,
    profile.total_budget && `Budget: $${profile.total_budget}`,
  ].filter(Boolean);

  const recent = history
    .slice(-8)
    .map((m) => `${m.role === "user" ? "Them" : "You"}: ${m.text}`)
    .join("\n");

  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    tools: [CHECKIN_TOOL],
    tool_choice: { type: "tool", name: "send_checkin" },
    system: `You are the couple's wedding planner at Altared, and you text them like a person who knows their plans, not an app sending reminders. Today is ${now.toISOString().slice(0, 10)}.

Pick the ONE moment below that a thoughtful planner would actually text about today, and write that text. Skip (subject_key null) if none of them feel natural, timely or useful.

How it should sound:
- Like a friend who's helping: "How'd the call with Bloom & Vine go?", "Did you get a chance to send the save-the-dates you mentioned?", "I noticed you haven't started looking for a florist yet. Want a hand getting started?"
- One or two short sentences. Casual, warm, specific. Use their first name now and then, not every time.
- Ask one question they can answer in a few words, or offer one concrete next step.
- Never sound like a notification: no "Reminder:", no "Task due", no lists, no emoji walls, no exclamation-mark pileups.
- Don't repeat something you already said in the recent texts, and don't bring up a subject they just talked about.`,
    messages: [
      {
        role: "user",
        content: `About them:\n${about.join("\n") || "(no details yet)"}\n\nRecent texts:\n${recent || "(none yet)"}\n\nMoments you could text about:\n${candidates
          .map((c) => `- [${c.subject_key}] (${c.kind}) ${c.detail}`)
          .join("\n")}`,
      },
    ],
  });

  const call = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  const input = call?.input as { subject_key: string | null; message: string } | undefined;
  if (!input?.subject_key || !input.message.trim()) return null;
  if (!candidates.some((c) => c.subject_key === input.subject_key)) return null;
  return { subject_key: input.subject_key, message: input.message.trim() };
}

import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACCESS_PROFILE_COLUMNS, resolveAccess, type AccessProfile } from "@/lib/plan-access";
import {
  getConversationHistory,
  getConversationMessages,
  sendText,
  verifyHelloWebhook,
  type HelloEvent,
  type HelloMessageEvent,
} from "@/lib/hello/client";
import { replyToCouple } from "@/lib/hello/planner";
import { describeQuoteResult, scanQuotePhotos } from "@/lib/hello/quote-photo";

// The planner can take several model calls; the reply is sent after the 200.
export const maxDuration = 60;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://altared.app";

export async function POST(request: NextRequest) {
  // Verify against the raw body before parsing
  const rawBody = await request.text();
  if (!verifyHelloWebhook(rawBody, request.headers)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as HelloEvent;
  // Tapbacks need no reply
  if (event.type !== "message.received") {
    return NextResponse.json({ received: true });
  }

  // Acknowledge right away so hello doesn't retry while the planner thinks
  after(() => handleMessage(event as HelloMessageEvent));
  return NextResponse.json({ received: true });
}

async function handleMessage(event: HelloMessageEvent) {
  try {
    if (!event.external_user_id) {
      await sendText(
        event.from,
        `To text your Altared planner, connect your phone from Settings → Texting at ${APP_URL}/settings.`
      );
      return;
    }

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        `full_name, partner_name, wedding_name, wedding_date, wedding_location, estimated_guest_count, total_budget, ${ACCESS_PROFILE_COLUMNS}`
      )
      .eq("id", event.external_user_id)
      .single();

    if (!profile) {
      await sendText(event.from, `I couldn't find your Altared account. Reconnect from ${APP_URL}/settings.`);
      return;
    }

    // Where check-ins go, and when the couple last spoke (check-ins hold off mid-conversation)
    await supabase
      .from("profiles")
      .update({
        text_phone: event.from,
        text_conversation_id: event.conversation_id,
        text_last_inbound_at: new Date().toISOString(),
      })
      .eq("id", event.external_user_id);

    if (resolveAccess(profile as AccessProfile).locked) {
      await sendText(
        event.from,
        `Your free trial has ended. Get the Wedding Pass to keep texting your planner: ${APP_URL}/pass`
      );
      return;
    }

    // The first message is the join code that linked the phone, so greet instead of answering it
    if (event.is_first_message) {
      const name = profile.full_name?.split(" ")[0];
      await sendText(
        event.from,
        `${name ? `Hi ${name}! ` : "Hi! "}You're connected to your Altared planner. Text me anytime, like:\n- What's due this week?\n- Paid the florist $500 deposit\n- What's left in the photography budget?\n- What's the caterer's phone number?`
      );
      return;
    }

    const caption = event.text?.trim() ?? "";
    let latest = caption;

    if (event.image_count) {
      await sendText(event.from, "Got it, reading that now…");
      const messages = await getConversationMessages(event.conversation_id);
      const withPhotos = messages.filter((m) => m.role === "user" && m.images.length).at(-1);
      const result = withPhotos
        ? await scanQuotePhotos(supabase, event.external_user_id, withPhotos.images)
        : ({ kind: "unreadable" } as const);
      latest = describeQuoteResult(result, caption);
    }

    if (!latest) return;

    // A reply like "it went great!" is usually answering the last check-in
    const { data: checkin } = await supabase
      .from("text_checkins")
      .select("body, sent_at")
      .eq("user_id", event.external_user_id)
      .gte("sent_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (checkin) {
      latest = `[Your most recent check-in to them, sent ${checkin.sent_at.slice(0, 10)}: "${checkin.body}"]\n${latest}`;
    }

    const history = await getConversationHistory(event.conversation_id);
    const reply = await replyToCouple(
      supabase,
      event.external_user_id,
      profile,
      history,
      latest
    );
    await sendText(event.from, reply);
  } catch (err) {
    console.error("hello webhook handling failed:", err);
    try {
      await sendText(event.from, "Something went wrong on my end. Give me a minute and try again.");
    } catch {
      // Nothing more to do if hello itself is unreachable
    }
  }
}

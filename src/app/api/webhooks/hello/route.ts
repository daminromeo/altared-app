import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACCESS_PROFILE_COLUMNS, resolveAccess, type AccessProfile } from "@/lib/plan-access";
import {
  getConversationHistory,
  sendText,
  verifyHelloWebhook,
  type HelloEvent,
  type HelloMessageEvent,
} from "@/lib/hello/client";
import { replyToCouple } from "@/lib/hello/planner";

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

    if (!event.text?.trim()) {
      if (event.image_count) {
        await sendText(event.from, "I can't read photos yet. Text me what you need and I'll help.");
      }
      return;
    }

    const history = await getConversationHistory(event.conversation_id);
    const reply = await replyToCouple(
      supabase,
      event.external_user_id,
      profile,
      history,
      event.text
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

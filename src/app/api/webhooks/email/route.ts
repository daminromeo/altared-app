import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface InboundEmailPayload {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Extracts a user ID from the "to" address.
 * Expected format: user_{userId}@inbound.altared.app
 */
function extractUserIdFromAddress(toAddress: string): string | null {
  const match = toAddress.match(/user[_-]([a-f0-9-]+)@/i);
  return match?.[1] ?? null;
}

/**
 * Extracts the email address from a "Name <email>" style string.
 */
function extractEmailAddress(fromField: string): string {
  const match = fromField.match(/<([^>]+)>/);
  return match?.[1]?.toLowerCase() ?? fromField.toLowerCase().trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: InboundEmailPayload = await request.json();
    const { from, to, subject, text, html } = body;

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing required email fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Parse the "to" address to extract user ID
    const userId = extractUserIdFromAddress(to);

    if (!userId) {
      console.error("Could not extract user ID from to address:", to);
      return NextResponse.json(
        { error: "Could not determine recipient user" },
        { status: 400 }
      );
    }

    // Verify the user exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Try to auto-match the sender to a vendor by email
    const senderEmail = extractEmailAddress(from);

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", userId)
      .ilike("email", senderEmail)
      .limit(1)
      .maybeSingle();

    // If no matching vendor, we still create the message but it won't be linked properly.
    // In production, you'd want a way to handle unmatched senders.
    if (!vendor) {
      console.warn(
        `No vendor match found for sender ${senderEmail}, user ${userId}`
      );
      // We still acknowledge the webhook to prevent retries
      return NextResponse.json({
        received: true,
        matched: false,
        note: "No matching vendor found for sender email",
      });
    }

    // Use plain text body, fall back to stripping HTML
    const messageBody =
      text?.trim() ||
      html?.replace(/<[^>]*>/g, "").trim() ||
      "(No message body)";

    // Create the message record
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        vendor_id: vendor.id,
        direction: "inbound",
        source: "email",
        subject: subject || null,
        body: messageBody,
        sent_at: new Date().toISOString(),
        is_read: false,
        metadata: {
          from_email: senderEmail,
          from_raw: from,
          to_raw: to,
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating message from email webhook:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      received: true,
      matched: true,
      messageId: message.id,
    });
  } catch (err) {
    console.error("POST /api/webhooks/email error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

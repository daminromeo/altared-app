// hello carries texts (iMessage, SMS, RCS) between couples and the planner.
// It is only the pipe: the planner logic lives in ./planner.ts.

import crypto from "node:crypto";

const HELLO_API = "https://api.ohhello.to/api/v1";

/** Signed webhooks older than this are rejected, so a captured request can't be replayed. */
const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

export interface HelloMessageEvent {
  type: "message.received";
  from: string;
  /** The Altared user id the phone was linked to; null for anonymous senders */
  external_user_id: string | null;
  conversation_id: string;
  message_id: string;
  text: string;
  is_first_message: boolean;
  image_count?: number;
}

export type HelloEvent =
  | HelloMessageEvent
  | { type: "reaction.added" | "reaction.removed" }
  | { type: string };

export interface HistoryMessage {
  role: "user" | "assistant";
  text: string;
}

async function helloFetch(path: string, init: RequestInit = {}) {
  if (!process.env.HELLO_API_KEY) {
    throw new Error("HELLO_API_KEY is not set");
  }
  const res = await fetch(`${HELLO_API}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.HELLO_API_KEY}`,
      ...init.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`hello ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function sendText(to: string, text: string) {
  return helloFetch("/messages", {
    method: "POST",
    body: JSON.stringify({ to, text }),
  });
}

/**
 * Mints a single-use code (valid ~30 minutes) that links the phone that
 * texts it to this user. mode is "sandbox" or "live", from the API key.
 */
export async function createUserLinkCode(userId: string) {
  return helloFetch("/user-link-codes", {
    method: "POST",
    body: JSON.stringify({ external_user_id: userId }),
  }) as Promise<{ sms_link: string; mode: "live" | "sandbox" }>;
}

/**
 * Recent messages in a conversation, oldest first, for the planner's context.
 * Failures return an empty history so the planner still answers the latest text.
 */
export async function getConversationHistory(
  conversationId: string,
  limit = 12
): Promise<HistoryMessage[]> {
  try {
    const data = await helloFetch(
      `/conversations/${encodeURIComponent(conversationId)}/messages`
    );
    const rows: Record<string, unknown>[] = Array.isArray(data)
      ? data
      : (data.messages ?? data.data ?? []);

    return rows
      .map((row): HistoryMessage | null => {
        const text = typeof row.text === "string" ? row.text.trim() : "";
        if (!text) return null;
        const direction = String(row.direction ?? row.role ?? row.sender ?? "");
        const fromUs = /^(out|outbound|outgoing|assistant|agent|bot)/i.test(direction);
        return { role: fromUs ? "assistant" : "user", text };
      })
      .filter((m): m is HistoryMessage => m !== null)
      .slice(-limit);
  } catch (err) {
    console.error("hello history fetch failed:", err);
    return [];
  }
}

/**
 * Verifies a Standard Webhooks signature against the raw body. hello signs
 * live and sandbox (Simulator) deliveries with different secrets, so either
 * one is accepted.
 */
export function verifyHelloWebhook(rawBody: string, headers: Headers): boolean {
  const id = headers.get("webhook-id") ?? "";
  const timestamp = headers.get("webhook-timestamp") ?? "";
  const signatureHeader = headers.get("webhook-signature") ?? "";
  if (!id || !timestamp || !signatureHeader) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > MAX_WEBHOOK_AGE_SECONDS) return false;

  const secrets = [
    process.env.HELLO_WEBHOOK_SECRET,
    process.env.HELLO_SANDBOX_WEBHOOK_SECRET,
  ].filter((s): s is string => !!s);

  const signatures = signatureHeader
    .split(" ")
    .map((entry) => entry.split(",")[1])
    .filter((sig): sig is string => !!sig);

  return secrets.some((secret) => {
    const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const expected = Buffer.from(
      crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64")
    );
    return signatures.some((sig) => {
      const given = Buffer.from(sig);
      return given.length === expected.length && crypto.timingSafeEqual(given, expected);
    });
  });
}

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notifyNewSignup } from "@/lib/slack/notify"

/**
 * Supabase Database Webhook — POSTs here on INSERT into public.profiles.
 *
 * The handle_new_user() trigger inserts one profile row per new auth user, so
 * this fires for EVERY signup regardless of path — email (auto-confirmed, never
 * hits /callback) and OAuth alike. This is the single source of truth for
 * new-signup Slack alerts; the /callback route no longer sends them.
 *
 * Configure in Supabase → Database → Webhooks:
 *   Table: public.profiles · Events: INSERT · Method: POST
 *   URL: https://altared.app/api/webhooks/supabase/new-user
 *   HTTP header: Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>
 * Set SUPABASE_WEBHOOK_SECRET in Vercel (Production) to the same value.
 */

type WebhookBody = {
  type?: string
  table?: string
  schema?: string
  record?: { id?: string; email?: string | null; full_name?: string | null }
}

export async function POST(request: NextRequest) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET
  const provided = request.headers.get("authorization")
  if (!secret || provided !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: WebhookBody
  try {
    body = (await request.json()) as WebhookBody
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 })
  }

  // Only act on new profile rows.
  if (body.type !== "INSERT" || body.table !== "profiles" || !body.record?.id) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { id, email, full_name } = body.record

  // Best-effort provider (email vs google) — non-fatal if it fails.
  let provider = "email"
  try {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.getUserById(id)
    provider =
      (data.user?.app_metadata?.provider as string | undefined) ?? "email"
  } catch {
    // provider is nice-to-have; ignore lookup failures
  }

  // Awaited (not fire-and-forget): this is a webhook response, so the request
  // stays alive until the Slack POST completes.
  await notifyNewSignup({ email: email ?? null, name: full_name ?? null, provider })

  return NextResponse.json({ ok: true })
}

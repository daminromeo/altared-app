import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import type { Tables } from "@/lib/types/database";

type ShareLink = Tables<"partner_share_links">;

const createSchema = z.object({
  expiresInDays: z.number().min(1).max(90).optional(),
});

// POST — Generate a new share link
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    const plan = profile?.subscription_status ?? "free";
    if (plan === "free") {
      return NextResponse.json(
        { error: "upgrade_required", feature: "partner_sharing" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    const expiresInDays = parsed.success ? parsed.data.expiresInDays : undefined;

    // Deactivate any existing active links (one active link at a time)
    await supabase
      .from("partner_share_links")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);

    const token = randomBytes(32).toString("hex");
    const expires_at = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: link, error } = await supabase
      .from("partner_share_links")
      .insert({
        user_id: user.id,
        token,
        is_active: true,
        expires_at,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.json({
      link,
      shareUrl: `${appUrl}/share/${token}`,
    });
  } catch (err) {
    console.error("POST /api/share error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET — List user's share links
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: links, error } = await supabase
      .from("partner_share_links")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const typedLinks = (links ?? []) as ShareLink[];
    return NextResponse.json({
      links: typedLinks.map((l) => ({
        ...l,
        shareUrl: `${appUrl}/share/${l.token}`,
      })),
    });
  } catch (err) {
    console.error("GET /api/share error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE — Revoke a share link
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing link id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("partner_share_links")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/share error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

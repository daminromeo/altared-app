import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { Tables } from "@/lib/types/database";

type ShareLink = Tables<"partner_share_links">;

const reactionSchema = z.object({
  vendorId: z.string().uuid(),
  partnerName: z.string().min(1).max(100),
  reaction: z.enum(["thumbs_up", "thumbs_down"]),
  comment: z.string().max(280).optional(),
});

// POST — Submit or update a partner reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    // Validate token
    const { data: linkRaw } = await supabase
      .from("partner_share_links")
      .select("id, user_id, is_active, expires_at")
      .eq("token", token)
      .eq("is_active", true)
      .single();

    const link = linkRaw as Pick<ShareLink, "id" | "user_id" | "is_active" | "expires_at"> | null;

    if (!link) {
      return NextResponse.json(
        { error: "invalid_or_expired" },
        { status: 404 }
      );
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "invalid_or_expired" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = reactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { vendorId, partnerName, reaction, comment } = parsed.data;

    // Verify vendor belongs to the share link's owner
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", vendorId)
      .eq("user_id", link.user_id)
      .single();

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Upsert reaction (one per vendor per share link)
    const { data: existingRaw } = await supabase
      .from("partner_reactions")
      .select("id")
      .eq("share_link_id", link.id)
      .eq("vendor_id", vendorId)
      .single();

    const existing = existingRaw as { id: string } | null;

    let result;
    if (existing) {
      result = await supabase
        .from("partner_reactions")
        .update({
          reaction,
          partner_name: partnerName,
          comment: comment ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("partner_reactions")
        .insert({
          share_link_id: link.id,
          vendor_id: vendorId,
          partner_name: partnerName,
          reaction,
          comment: comment ?? null,
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ reaction: result.data });
  } catch (err) {
    console.error("POST /api/share/[token]/react error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

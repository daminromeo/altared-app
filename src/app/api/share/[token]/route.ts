import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/types/database";

type ShareLink = Tables<"partner_share_links">;

// GET — Fetch all shared data for the partner view (unauthenticated)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    // Validate token
    const { data: linkRaw, error: linkError } = await supabase
      .from("partner_share_links")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .single();

    const link = linkRaw as ShareLink | null;

    if (linkError || !link) {
      return NextResponse.json(
        { error: "invalid_or_expired" },
        { status: 404 }
      );
    }

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "invalid_or_expired" },
        { status: 404 }
      );
    }

    // Update last_accessed_at
    await supabase
      .from("partner_share_links")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", link.id);

    const userId = link.user_id;

    // Fetch profile (safe fields only)
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "full_name, partner_name, wedding_name, wedding_date, wedding_location, total_budget"
      )
      .eq("id", userId)
      .single();

    // Fetch vendors (exclude sensitive fields: email, phone, notes)
    const { data: vendors } = await supabase
      .from("vendors")
      .select(
        "id, name, company_name, website, instagram, source, status, rating, quoted_price, final_price, deposit_amount, deposit_due_date, deposit_paid, is_booked, booked_date, tags, metadata, category_id, vendor_categories(name, icon)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Fetch budget items (include vendor_id for payment status linking)
    const { data: rawBudgetItems } = await supabase
      .from("budget_items")
      .select(
        "id, description, estimated_cost, actual_cost, is_paid, category_id, vendor_id, vendor_categories(name)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Sync budget items with linked vendor data (mirrors budget page logic)
    // This ensures amounts, payment status, and categories match vendor truth
    const vendorPaymentMap = new Map<
      string,
      {
        categoryId: string | null;
        categoryName: string | null;
        isPaid: boolean;
        actualCost: number;
        estimatedCost: number;
        depositPaid: boolean;
      }
    >();
    if (vendors) {
      for (const v of vendors) {
        if (v.status !== "booked") continue;
        const meta = v.metadata as Record<string, unknown> | null;
        const paymentStatus =
          (meta?.payment_status as string) ||
          (v.deposit_paid ? "deposit_paid" : "unpaid");
        const isPaid = paymentStatus === "paid_in_full";
        const actualCost =
          paymentStatus === "paid_in_full"
            ? v.final_price || v.quoted_price || 0
            : paymentStatus === "deposit_paid"
              ? v.deposit_amount || 0
              : 0;
        const estimatedCost = v.final_price || v.quoted_price || 0;
        const catData = v.vendor_categories as { name: string; icon: string | null } | null;
        vendorPaymentMap.set(v.id, {
          categoryId: v.category_id,
          categoryName: catData?.name ?? null,
          isPaid,
          actualCost,
          estimatedCost,
          depositPaid: v.deposit_paid,
        });
      }
    }

    const budgetItems = (rawBudgetItems ?? []).map((item) => {
      const bi = item as {
        id: string;
        description: string;
        estimated_cost: number;
        actual_cost: number;
        is_paid: boolean;
        category_id: string | null;
        vendor_id: string | null;
        vendor_categories: { name: string } | null;
      };
      if (!bi.vendor_id) return bi;
      const vp = vendorPaymentMap.get(bi.vendor_id);
      if (!vp) return bi;
      // Strip stale " – OldCategory" suffix from description since the
      // correct category is shown separately via vendor_categories
      let description = bi.description;
      const dashIdx = description.lastIndexOf(" – ");
      if (dashIdx > 0) {
        description = description.slice(0, dashIdx);
      }

      return {
        ...bi,
        description,
        is_paid: vp.isPaid,
        deposit_paid: vp.depositPaid,
        estimated_cost:
          vp.estimatedCost > 0 ? vp.estimatedCost : bi.estimated_cost,
        actual_cost: vp.actualCost > 0 ? vp.actualCost : bi.actual_cost,
        category_id: vp.categoryId ?? bi.category_id,
        vendor_categories: vp.categoryName
          ? { name: vp.categoryName }
          : bi.vendor_categories,
      };
    });

    // Fetch existing reactions for this share link
    const { data: reactions } = await supabase
      .from("partner_reactions")
      .select("*")
      .eq("share_link_id", link.id);

    return NextResponse.json({
      profile: profile ?? null,
      vendors: vendors ?? [],
      budgetItems: budgetItems ?? [],
      reactions: reactions ?? [],
      partnerName: link.partner_name,
    });
  } catch (err) {
    console.error("GET /api/share/[token] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH — Set partner name on first visit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    const { data: linkRaw } = await supabase
      .from("partner_share_links")
      .select("id, is_active, expires_at")
      .eq("token", token)
      .eq("is_active", true)
      .single();

    const link = linkRaw as Pick<
      ShareLink,
      "id" | "is_active" | "expires_at"
    > | null;

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
    const partnerName =
      typeof body.partnerName === "string"
        ? body.partnerName.trim().slice(0, 100)
        : null;

    if (!partnerName) {
      return NextResponse.json(
        { error: "Partner name is required" },
        { status: 400 }
      );
    }

    await supabase
      .from("partner_share_links")
      .update({ partner_name: partnerName })
      .eq("id", link.id);

    return NextResponse.json({ success: true, partnerName });
  } catch (err) {
    console.error("PATCH /api/share/[token] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

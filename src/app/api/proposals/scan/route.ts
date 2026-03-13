import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseProposal } from "@/lib/anthropic/proposal-parser";
import { getPlan } from "@/lib/stripe/config";
import { z } from "zod";

const scanRequestSchema = z.object({
  proposalId: z.string().uuid("Valid proposal ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check proposal scan limit
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    const plan = getPlan(profile?.subscription_status ?? "free");
    const scanLimit = plan.limits.proposalScans;

    if (scanLimit !== Infinity) {
      // Count completed scans this calendar month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count } = await supabase
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("scan_status", "completed")
        .gte("updated_at", monthStart);

      if (count !== null && count >= scanLimit) {
        return NextResponse.json(
          {
            error: "scan_limit_reached",
            message:
              scanLimit === 0
                ? `AI proposal scanning is a Pro feature. Upgrade to scan proposals.`
                : `You've used all ${scanLimit} AI scans this month. Upgrade for more.`,
            limit: scanLimit,
            used: count,
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const parsed = scanRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { proposalId } = parsed.data;

    // Fetch proposal record (verify ownership)
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select("id, file_url, scan_status, user_id")
      .eq("id", proposalId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    if (!proposal.file_url) {
      return NextResponse.json(
        { error: "Proposal has no file attached" },
        { status: 400 }
      );
    }

    // Mark as scanning
    await supabase
      .from("proposals")
      .update({ scan_status: "scanning", updated_at: new Date().toISOString() })
      .eq("id", proposalId);

    try {
      // Generate a signed URL for the file
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('proposals')
        .createSignedUrl(proposal.file_url, 300); // 5 min expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new Error(`Failed to get file URL: ${signedUrlError?.message || 'Unknown error'}`);
      }

      // Parse the proposal PDF using the AI parser
      const scanResult = await parseProposal(signedUrlData.signedUrl);

      // Update proposal with extracted data
      const { data: updated, error: updateError } = await supabase
        .from("proposals")
        .update({
          scan_status: "completed",
          scanned_data: JSON.parse(JSON.stringify(scanResult)),
          extracted_vendor_name: scanResult.vendorName,
          extracted_total_price: scanResult.totalCost,
          extracted_deposit_amount: scanResult.depositAmount,
          extracted_deposit_due_date: scanResult.depositDueDate,
          extracted_services: scanResult.services,
          extracted_payment_schedule:
            JSON.parse(JSON.stringify(scanResult.paymentSchedule)),
          extracted_cancellation_policy: scanResult.cancellationPolicy,
          extracted_notes: scanResult.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId)
        .select("*")
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      return NextResponse.json({
        proposal: updated,
        scanResult,
      });
    } catch (scanError) {
      // Mark as failed
      await supabase
        .from("proposals")
        .update({
          scan_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      console.error("Proposal scan failed:", scanError);
      return NextResponse.json(
        {
          error: "Failed to scan proposal",
          details:
            scanError instanceof Error
              ? scanError.message
              : "Unknown scan error",
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("POST /api/proposals/scan error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

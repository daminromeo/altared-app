// Photos of a quote texted to the planner: scan them with the same parser the
// Proposals page uses, save the quote, and file it under a vendor (matching an
// existing one by name, or adding it).

import type { SupabaseClient } from "@supabase/supabase-js";
import { parseProposalFromImages } from "@/lib/anthropic/proposal-parser";
import type { Database } from "@/lib/types/database";
import type { PhotoScanResult } from "@/lib/anthropic/proposal-parser";
import type { ConversationMessage } from "./client";
import { findCategory } from "./planner";

type Admin = SupabaseClient<Database>;

// The scanner reads these; iPhone HEIC photos have to come in as screenshots
const SCANNABLE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_PAGES = 5;

export type QuotePhotoResult =
  | { kind: "unreadable" }
  | { kind: "not_a_quote" }
  | {
      kind: "saved";
      proposalId: string;
      vendor: { id: string; name: string; isNew: boolean };
      scan: PhotoScanResult;
    };

export async function scanQuotePhotos(
  db: Admin,
  userId: string,
  images: ConversationMessage["images"]
): Promise<QuotePhotoResult> {
  const pages: { base64: string; mimeType: string; bytes: Buffer }[] = [];
  for (const image of images.slice(0, MAX_PAGES)) {
    const mimeType = image.mimeType.toLowerCase();
    if (!SCANNABLE_TYPES.includes(mimeType)) continue;
    const res = await fetch(image.url);
    if (!res.ok) continue;
    const bytes = Buffer.from(await res.arrayBuffer());
    pages.push({ base64: bytes.toString("base64"), mimeType, bytes });
  }
  if (pages.length === 0) return { kind: "unreadable" };

  const scan = await parseProposalFromImages(pages);
  if (!scan.vendorName && scan.totalCost == null) return { kind: "not_a_quote" };

  const vendor = await matchOrAddVendor(db, userId, scan);

  // Keep the first page as the quote's file, like an uploaded PDF
  const first = pages[0];
  const filePath = `${crypto.randomUUID()}.${first.mimeType.split("/")[1]}`;
  const { error: uploadError } = await db.storage
    .from("proposals")
    .upload(filePath, first.bytes, { contentType: first.mimeType, upsert: false });
  if (uploadError) throw new Error(`Quote upload failed: ${uploadError.message}`);

  const { data: proposal, error } = await db
    .from("proposals")
    .insert({
      user_id: userId,
      vendor_id: vendor.id,
      file_url: filePath,
      file_name: `${scan.vendorName ?? "Quote"} (texted photo).${first.mimeType.split("/")[1]}`,
      file_size: first.bytes.length,
      scan_status: "completed",
      scanned_data: JSON.parse(JSON.stringify(scan)),
      extracted_vendor_name: scan.vendorName,
      extracted_total_price: scan.totalCost,
      extracted_deposit_amount: scan.depositAmount,
      extracted_deposit_due_date: scan.depositDueDate,
      extracted_services: scan.services,
      extracted_payment_schedule: JSON.parse(JSON.stringify(scan.paymentSchedule ?? [])),
      extracted_cancellation_policy: scan.cancellationPolicy,
      extracted_notes: scan.notes,
    })
    .select("id")
    .single();
  if (error) {
    await db.storage.from("proposals").remove([filePath]);
    throw error;
  }

  return { kind: "saved", proposalId: proposal.id, vendor, scan };
}

async function matchOrAddVendor(db: Admin, userId: string, scan: PhotoScanResult) {
  const name = scan.vendorName?.trim() || "Unnamed vendor";

  const { data: existing } = await db
    .from("vendors")
    .select("id, name, quoted_price, email, phone, website, deposit_amount, deposit_due_date, status")
    .eq("user_id", userId)
    .or(`name.ilike.%${name.replace(/[%,()]/g, "")}%,company_name.ilike.%${name.replace(/[%,()]/g, "")}%`)
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Fill in what the quote adds without overwriting what the couple entered
    await db
      .from("vendors")
      .update({
        quoted_price: existing.quoted_price ?? scan.totalCost,
        email: existing.email ?? scan.vendorEmail,
        phone: existing.phone ?? scan.vendorPhone,
        website: existing.website ?? scan.vendorWebsite,
        deposit_amount: existing.deposit_amount ?? scan.depositAmount,
        deposit_due_date: existing.deposit_due_date ?? scan.depositDueDate,
        status: ["researching", "contacted", "meeting_scheduled"].includes(existing.status)
          ? "quoted"
          : existing.status,
      })
      .eq("id", existing.id)
      .eq("user_id", userId);
    return { id: existing.id, name: existing.name, isNew: false };
  }

  const category = await findCategory(db, userId, scan.category ?? undefined);
  const { data: created, error } = await db
    .from("vendors")
    .insert({
      user_id: userId,
      name,
      category_id: category?.id ?? null,
      email: scan.vendorEmail,
      phone: scan.vendorPhone,
      website: scan.vendorWebsite,
      quoted_price: scan.totalCost,
      deposit_amount: scan.depositAmount,
      deposit_due_date: scan.depositDueDate,
      status: "quoted",
      source: "other",
    })
    .select("id, name")
    .single();
  if (error) throw error;
  return { id: created.id, name: created.name, isNew: true };
}

/** How the scanned quote is described to the planner, which writes the reply. */
export function describeQuoteResult(result: QuotePhotoResult, caption: string) {
  const said = caption ? ` Their caption: "${caption}".` : "";
  if (result.kind === "unreadable") {
    return `[The couple texted a photo I couldn't open, likely an iPhone HEIC photo.${said} Ask them to send a screenshot of it instead, or upload the PDF under Quotes in the dashboard.]`;
  }
  if (result.kind === "not_a_quote") {
    return `[The couple texted a photo that isn't a vendor quote.${said} Respond to it naturally; if they meant to send a quote, ask for a clearer photo.]`;
  }
  const { vendor, scan } = result;
  const partial = scan.appearsIncomplete
    ? `\nThe photo looks like only part of the quote (${scan.incompleteReason ?? "some of it seems cut off"}). Say so up front, and ask them to send the full quote or contract: the PDF (they can upload it under Quotes in the dashboard) or screenshots of the rest. Don't flag things as missing that may just be cut off.`
    : "";
  return `[The couple texted a photo of a quote. I scanned it, saved it under Quotes, and ${
    vendor.isNew ? `added ${vendor.name} as a new vendor` : `filed it under their existing vendor ${vendor.name}`
  }.${said}
Scanned quote: ${JSON.stringify(scan)}
Reply with: total, deposit and when it's due, then flag anything worth a second look, such as service charges, gratuity, overtime, travel, cake-cutting or corkage fees, taxes not included, or a strict cancellation policy. Keep it to a short text.${partial}]`;
}

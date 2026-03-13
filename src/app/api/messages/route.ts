import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createMessageSchema = z.object({
  vendor_id: z.string().uuid("Valid vendor ID is required"),
  direction: z.enum(["inbound", "outbound"]),
  source: z.string().min(1, "Source is required"),
  subject: z.string().max(500).nullish(),
  body: z.string().min(1, "Message body is required").max(10000),
  received_at: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
});

const updateMessageSchema = z.object({
  id: z.string().uuid("Valid message ID is required"),
  is_read: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const vendorId = searchParams.get("vendor_id");
    const source = searchParams.get("source");
    const isRead = searchParams.get("is_read");

    let query = supabase
      .from("messages")
      .select("*, vendors(id, name, email)")
      .eq("user_id", user.id)
      .order("received_at", { ascending: false });

    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    if (source) {
      query = query.eq("source", source);
    }

    if (isRead === "true") {
      query = query.eq("is_read", true);
    } else if (isRead === "false") {
      query = query.eq("is_read", false);
    }

    const { data: messages, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("GET /api/messages error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify the vendor belongs to the user
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", parsed.data.vendor_id)
      .eq("user_id", user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        user_id: user.id,
        vendor_id: parsed.data.vendor_id,
        direction: parsed.data.direction,
        source: parsed.data.source,
        subject: parsed.data.subject ?? null,
        body: parsed.data.body,
        received_at: parsed.data.received_at ?? new Date().toISOString(),
        is_read: parsed.data.direction === "outbound",
        metadata: (parsed.data.metadata ?? {}) as Record<string, string>,
      })
      .select("*, vendors(id, name, email)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    // Verify ownership
    const { data: existing } = await supabase
      .from("messages")
      .select("id, metadata")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Merge metadata if provided
    const updatePayload: Record<string, unknown> = {
    };

    if (updateData.is_read !== undefined) {
      updatePayload.is_read = updateData.is_read;
    }

    if (updateData.metadata !== undefined) {
      const existingMeta =
        (existing.metadata as Record<string, unknown>) ?? {};
      updatePayload.metadata = {
        ...existingMeta,
        ...updateData.metadata,
      };
    }

    const { data: message, error } = await supabase
      .from("messages")
      .update(updatePayload)
      .eq("id", id)
      .select("*, vendors(id, name, email)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (err) {
    console.error("PATCH /api/messages error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getPlan } from "@/lib/stripe/config";

const createVendorSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  category_id: z.string().uuid().nullish(),
  company_name: z.string().max(200).nullish(),
  email: z.string().email().nullish(),
  phone: z.string().max(50).nullish(),
  website: z.string().url().nullish(),
  instagram: z.string().max(100).nullish(),
  source: z.string().nullish(),
  source_url: z.string().url().nullish(),
  status: z.string().default("researching"),
  rating: z.number().min(0).max(5).nullish(),
  notes: z.string().max(5000).nullish(),
  quoted_price: z.number().min(0).nullish(),
  final_price: z.number().min(0).nullish(),
  deposit_amount: z.number().min(0).nullish(),
  deposit_paid: z.boolean().default(false),
  deposit_due_date: z.string().nullish(),
  is_booked: z.boolean().default(false),
  booked_date: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
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
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") ?? "created_at";
    const search = searchParams.get("search");

    let query = supabase
      .from("vendors")
      .select("*, vendor_categories(*)")
      .eq("user_id", user.id);

    if (category) {
      query = query.eq("category_id", category);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Sorting
    const sortField = ["name", "created_at", "updated_at", "quoted_price", "status"].includes(sort)
      ? sort
      : "created_at";
    const sortOrder = searchParams.get("order") === "asc" ? true : false;
    query = query.order(sortField, { ascending: sortOrder });

    const { data: vendors, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vendors });
  } catch (err) {
    console.error("GET /api/vendors error:", err);
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

    // Check vendor limit
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    const plan = getPlan(profile?.subscription_status ?? "free");
    const vendorLimit = plan.limits.vendors;

    if (vendorLimit !== Infinity) {
      const { count } = await supabase
        .from("vendors")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count !== null && count >= vendorLimit) {
        return NextResponse.json(
          {
            error: "vendor_limit_reached",
            message: `Your ${plan.name} plan supports up to ${vendorLimit} vendors. Upgrade to add more.`,
            limit: vendorLimit,
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const parsed = createVendorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: vendor, error } = await supabase
      .from("vendors")
      .insert({
        ...parsed.data,
        user_id: user.id,
      })
      .select("*, vendor_categories(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (err) {
    console.error("POST /api/vendors error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

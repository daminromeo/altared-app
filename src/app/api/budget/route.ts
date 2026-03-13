import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createBudgetItemSchema = z.object({
  vendor_id: z.string().uuid().nullish(),
  category_id: z.string().uuid().nullish(),
  description: z.string().min(1, "Description is required").max(500),
  estimated_cost: z.number().min(0).default(0),
  actual_cost: z.number().min(0).default(0),
  is_paid: z.boolean().default(false),
  paid_date: z.string().nullish(),
  due_date: z.string().nullish(),
  notes: z.string().max(2000).nullish(),
});

const updateBudgetItemSchema = z.object({
  id: z.string().uuid("Valid budget item ID is required"),
  vendor_id: z.string().uuid().nullish(),
  category_id: z.string().uuid().nullish(),
  description: z.string().min(1).max(500).optional(),
  estimated_cost: z.number().min(0).optional(),
  actual_cost: z.number().min(0).optional(),
  is_paid: z.boolean().optional(),
  paid_date: z.string().nullish(),
  due_date: z.string().nullish(),
  notes: z.string().max(2000).nullish(),
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

    let query = supabase
      .from("budget_items")
      .select("*, vendors(id, name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category_id", category);
    }

    const { data: budgetItems, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ budgetItems });
  } catch (err) {
    console.error("GET /api/budget error:", err);
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
    const parsed = createBudgetItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: budgetItem, error } = await supabase
      .from("budget_items")
      .insert({
        ...parsed.data,
        user_id: user.id,
      })
      .select("*, vendors(id, name)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ budgetItem }, { status: 201 });
  } catch (err) {
    console.error("POST /api/budget error:", err);
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
    const parsed = updateBudgetItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    // Verify ownership
    const { data: existing } = await supabase
      .from("budget_items")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Budget item not found" },
        { status: 404 }
      );
    }

    const { data: budgetItem, error } = await supabase
      .from("budget_items")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, vendors(id, name)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ budgetItem });
  } catch (err) {
    console.error("PATCH /api/budget error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Budget item ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from("budget_items")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Budget item not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase.from("budget_items").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/budget error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

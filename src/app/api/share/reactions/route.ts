import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — View all partner reactions for the authenticated user's vendors
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all share links for this user, then their reactions with vendor info
    const { data: links } = await supabase
      .from("partner_share_links")
      .select("id")
      .eq("user_id", user.id);

    if (!links || links.length === 0) {
      return NextResponse.json({ reactions: [] });
    }

    const linkIds = (links as { id: string }[]).map((l) => l.id);

    const { data: reactions, error } = await supabase
      .from("partner_reactions")
      .select("*, vendors(id, name, company_name)")
      .in("share_link_id", linkIds)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reactions: reactions ?? [] });
  } catch (err) {
    console.error("GET /api/share/reactions error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const importSchema = z.object({
  url: z.string().url("A valid The Knot URL is required"),
});

/**
 * Extracts vendor information from a The Knot URL.
 * Typical URL patterns:
 *   https://www.theknot.com/marketplace/vendor-name-city-state-123456
 *   https://www.theknot.com/marketplace/vendor-name-123456
 */
function parseTheKnotUrl(url: string): {
  name: string;
  location: string | null;
} {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname
      .split("/")
      .filter(Boolean)
      .filter((p) => p.toLowerCase() !== "marketplace");

    const slug = pathParts[0] ?? "";

    // Remove trailing numeric ID
    const cleanSlug = slug.replace(/-\d+$/, "");

    // Try to split into name and location (last 2 segments are usually city-state)
    const parts = cleanSlug.split("-");
    let name = cleanSlug;
    let location: string | null = null;

    // Heuristic: if there are enough parts, the last two may be city and state abbreviation
    if (parts.length >= 4) {
      const maybeState = parts[parts.length - 1];
      if (maybeState && maybeState.length === 2) {
        const city = parts[parts.length - 2] ?? "";
        location = `${city.charAt(0).toUpperCase() + city.slice(1)}, ${maybeState.toUpperCase()}`;
        name = parts.slice(0, -2).join("-");
      }
    }

    // Convert kebab-case to Title Case
    const formattedName = name
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    return {
      name: formattedName || "The Knot Vendor",
      location,
    };
  } catch {
    return { name: "The Knot Vendor", location: null };
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
    const parsed = importSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { url } = parsed.data;

    // Validate it's actually a The Knot URL
    if (!url.toLowerCase().includes("theknot.com")) {
      return NextResponse.json(
        { error: "URL does not appear to be from The Knot" },
        { status: 400 }
      );
    }

    const { name, location } = parseTheKnotUrl(url);

    const { data: vendor, error } = await supabase
      .from("vendors")
      .insert({
        user_id: user.id,
        name,
        website: url,
        address: location,
        source: "the_knot",
        status: "researching",
        notes: `Imported from The Knot: ${url}`,
      })
      .select("*, vendor_categories(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (err) {
    console.error("POST /api/integrations/theknot error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

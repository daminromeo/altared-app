import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const importSchema = z.object({
  url: z.string().url("A valid WeddingWire URL is required"),
});

/**
 * Extracts vendor information from a WeddingWire URL.
 * Typical URL patterns:
 *   https://www.weddingwire.com/biz/vendor-name-city-state/abc123.html
 *   https://www.weddingwire.com/reviews/vendor-name-city-state/abc123.html
 */
function parseWeddingWireUrl(url: string): {
  name: string;
  location: string | null;
} {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname
      .split("/")
      .filter(Boolean)
      .filter(
        (p) =>
          !["biz", "reviews", "wedding-vendors"].includes(p.toLowerCase())
      );

    const slug = pathParts[0] ?? "";

    // Remove trailing file extensions and IDs
    const cleanSlug = slug
      .replace(/\.html?$/i, "")
      .replace(/-[a-z0-9]{5,}$/i, "");

    // Try to extract location (last 2 parts: city and state abbreviation)
    const parts = cleanSlug.split("-");
    let name = cleanSlug;
    let location: string | null = null;

    if (parts.length >= 4) {
      const maybeState = parts[parts.length - 1];
      if (maybeState && maybeState.length === 2) {
        const city = parts[parts.length - 2] ?? "";
        location = `${city.charAt(0).toUpperCase() + city.slice(1)}, ${maybeState.toUpperCase()}`;
        name = parts.slice(0, -2).join("-");
      }
    }

    const formattedName = name
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    return {
      name: formattedName || "WeddingWire Vendor",
      location,
    };
  } catch {
    return { name: "WeddingWire Vendor", location: null };
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

    // Validate it's actually a WeddingWire URL
    if (!url.toLowerCase().includes("weddingwire.com")) {
      return NextResponse.json(
        { error: "URL does not appear to be from WeddingWire" },
        { status: 400 }
      );
    }

    const { name, location } = parseWeddingWireUrl(url);

    const { data: vendor, error } = await supabase
      .from("vendors")
      .insert({
        user_id: user.id,
        name,
        website: url,
        address: location,
        source: "wedding_wire",
        status: "researching",
        notes: `Imported from WeddingWire: ${url}`,
      })
      .select("*, vendor_categories(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (err) {
    console.error("POST /api/integrations/weddingwire error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

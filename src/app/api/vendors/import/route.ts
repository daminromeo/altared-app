import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const importVendorSchema = z.object({
  url: z.string().url("A valid URL is required"),
});

function detectSource(url: string): "the_knot" | "wedding_wire" | "other" {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("theknot.com") || lowerUrl.includes("the-knot.com")) {
    return "the_knot";
  }
  if (lowerUrl.includes("weddingwire.com") || lowerUrl.includes("wedding-wire.com")) {
    return "wedding_wire";
  }
  return "other";
}

// The Knot URL format: /marketplace/vendor-name-city-state-id
// We strip the trailing city-state-id portion to get a clean name
function extractNameFromTheKnotUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/").filter(Boolean);
    // Remove "marketplace" prefix
    const slug = parts.find((p) => p !== "marketplace") ?? "";

    // The Knot slugs end with city-state-id like "brooklyn-ny-1090474"
    // Remove trailing pattern: word-XX-digits (city-state-id)
    const cleaned = slug
      .replace(/-\d+$/, "") // remove trailing ID
      .replace(/-[a-z]{2}$/, "") // remove state abbreviation
      .replace(/-([a-z]+)$/, "") // remove city (last word after vendor name)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    return cleaned || "Imported Vendor";
  } catch {
    return "Imported Vendor";
  }
}

function extractNameFromWeddingWireUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/").filter(Boolean);
    const slug = parts.find(
      (p) => !["biz", "vendors", "reviews"].includes(p.toLowerCase())
    ) ?? "";

    const cleaned = slug
      .replace(/-[a-z0-9]+$/, "") // remove trailing ID
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    return cleaned || "Imported Vendor";
  } catch {
    return "Imported Vendor";
  }
}

// Map common URL path segments / page text to category names
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Venue": ["venue", "venues", "reception", "ceremony-venue", "banquet"],
  "Photography": ["photography", "photographer", "photographers", "photo"],
  "Videography": ["videography", "videographer", "videographers", "video"],
  "Catering": ["catering", "caterer", "caterers", "food"],
  "Florist": ["florist", "florals", "flowers", "floral"],
  "DJ": ["dj", "disc-jockey", "music"],
  "Band": ["band", "bands", "live-music"],
  "Wedding Planner": ["planner", "planners", "coordinator", "planning", "wedding-planner"],
  "Cake & Desserts": ["cake", "cakes", "bakery", "dessert", "desserts"],
  "Beauty": ["beauty", "makeup", "hair", "hair-makeup", "salon"],
  "Transportation": ["transportation", "limo", "car", "shuttle"],
  "Stationery": ["stationery", "invitations", "invitation", "paper"],
  "Rentals": ["rental", "rentals", "decor", "decoration", "decorations", "lighting"],
  "Officiant": ["officiant", "officiants", "minister"],
  "Attire": ["dress", "dresses", "attire", "bridal", "tuxedo", "suits"],
  "Jeweler": ["jeweler", "jewelry", "rings", "ring"],
};

function detectCategoryFromUrl(url: string): string | null {
  const lower = url.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return null;
}

function cleanScrapedName(raw: string): string {
  return raw
    // Remove common promotional suffixes
    .replace(/\s*\+\s*updated\s*prices?/i, "")
    .replace(/\s*\+\s*.*$/i, "") // Remove anything after "+"
    // Remove site suffixes
    .replace(/\s*[|–—-]\s*(The Knot|WeddingWire|Zola|Wedding Wire).*$/i, "")
    // Remove location patterns like "- Brooklyn, NY" or ", Brooklyn NY"
    .replace(/\s*[-,]\s+[A-Z][a-z]+,?\s+[A-Z]{2}\s*$/i, "")
    // Remove trailing whitespace/punctuation
    .replace(/[\s,.-]+$/, "")
    .trim();
}

interface ScrapedData {
  name: string | null;
  rating: number | null;
  reviewCount: number | null;
  location: string | null;
  category: string | null;
}

async function scrapeVendorPage(url: string, source: string): Promise<ScrapedData> {
  const result: ScrapedData = {
    name: null,
    rating: null,
    reviewCount: null,
    location: null,
    category: detectCategoryFromUrl(url),
  };

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return result;

    const html = await res.text();

    // --- JSON-LD structured data ---
    const jsonLdMatches = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );

    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match.replace(/<script[^>]*>|<\/script>/gi, "");
          const data = JSON.parse(jsonStr);
          const items = Array.isArray(data) ? data : [data];

          for (const item of items) {
            const itemType = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
            const isLocalBusiness = itemType.some((t: string) =>
              ["LocalBusiness", "Organization", "Store", "FoodEstablishment", "ProfessionalService"].includes(t)
            );

            if (isLocalBusiness) {
              result.name = cleanScrapedName(item.name || "") || result.name;

              if (item.aggregateRating) {
                result.rating = parseFloat(item.aggregateRating.ratingValue) || null;
                result.reviewCount =
                  parseInt(item.aggregateRating.reviewCount, 10) ||
                  parseInt(item.aggregateRating.ratingCount, 10) ||
                  null;
              }

              if (item.address) {
                const addr = item.address;
                const parts = [addr.addressLocality, addr.addressRegion].filter(Boolean);
                result.location = parts.join(", ") || null;
              }
            }
          }
        } catch {
          // continue
        }
      }
    }

    // --- __NEXT_DATA__ (The Knot uses Next.js) ---
    if (!result.name || result.reviewCount === null) {
      const nextDataMatch = html.match(
        /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
      );
      if (nextDataMatch) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]);
          const props = nextData?.props?.pageProps;

          if (props) {
            // The Knot stores vendor data in pageProps
            const vendor = props.vendor || props.storefront || props.listing || props;

            if (vendor.name && !result.name) {
              result.name = cleanScrapedName(vendor.name);
            }
            if (vendor.displayName && !result.name) {
              result.name = cleanScrapedName(vendor.displayName);
            }

            // Rating data
            const reviews = vendor.reviews || vendor.reviewSummary || vendor.reviewStats;
            if (reviews) {
              if (result.rating === null && reviews.averageRating) {
                result.rating = parseFloat(reviews.averageRating) || null;
              }
              if (result.rating === null && reviews.average) {
                result.rating = parseFloat(reviews.average) || null;
              }
              if (result.reviewCount === null && reviews.totalCount) {
                result.reviewCount = parseInt(reviews.totalCount, 10) || null;
              }
              if (result.reviewCount === null && reviews.count) {
                result.reviewCount = parseInt(reviews.count, 10) || null;
              }
              if (result.reviewCount === null && reviews.total) {
                result.reviewCount = parseInt(reviews.total, 10) || null;
              }
            }

            // Location
            if (!result.location) {
              const loc = vendor.location || vendor.address;
              if (loc) {
                const parts = [loc.city, loc.state || loc.region].filter(Boolean);
                result.location = parts.join(", ") || null;
              }
            }

            // Category
            if (!result.category && vendor.category) {
              result.category = vendor.category.name || vendor.category;
            }
          }
        } catch {
          // continue
        }
      }
    }

    // --- Fallback: og:title / title tag ---
    if (!result.name) {
      const ogTitle = html.match(
        /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
      );
      if (ogTitle) {
        result.name = cleanScrapedName(ogTitle[1]) || null;
      }
    }

    if (!result.name) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        result.name = cleanScrapedName(titleMatch[1]) || null;
      }
    }

    // --- Fallback: rating from HTML patterns ---
    if (result.rating === null) {
      const ratingMatch = html.match(
        /(?:data-rating|itemprop=["']ratingValue["'][^>]*content)=["']([0-9.]+)["']/i
      );
      if (ratingMatch) {
        result.rating = parseFloat(ratingMatch[1]) || null;
      }
    }

    // --- Fallback: review count from HTML patterns ---
    if (result.reviewCount === null) {
      // Common patterns: "(47 reviews)", "47 Reviews", "reviewCount":47
      const reviewCountMatch = html.match(
        /["']?reviewCount["']?\s*[:=]\s*["']?(\d+)["']?/i
      ) || html.match(
        /(\d+)\s+reviews?\b/i
      );
      if (reviewCountMatch) {
        result.reviewCount = parseInt(reviewCountMatch[1], 10) || null;
      }
    }
  } catch {
    // Network/timeout error
  }

  return result;
}

async function matchCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  detectedCategory: string | null
): Promise<string | null> {
  if (!detectedCategory) return null;

  const { data: categories } = await supabase
    .from("vendor_categories")
    .select("id, name");

  if (!categories || categories.length === 0) return null;

  const lowerDetected = detectedCategory.toLowerCase();

  // Exact match first
  const exact = categories.find(
    (c) => c.name.toLowerCase() === lowerDetected
  );
  if (exact) return exact.id;

  // Partial match
  const partial = categories.find(
    (c) =>
      c.name.toLowerCase().includes(lowerDetected) ||
      lowerDetected.includes(c.name.toLowerCase())
  );
  if (partial) return partial.id;

  return null;
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
    const parsed = importVendorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { url } = parsed.data;
    const source = detectSource(url);

    // Scrape the page for real vendor data
    const scraped = await scrapeVendorPage(url, source);

    // Use scraped name, fall back to source-specific URL extraction
    let name = scraped.name;
    if (!name) {
      if (source === "the_knot") {
        name = extractNameFromTheKnotUrl(url);
      } else if (source === "wedding_wire") {
        name = extractNameFromWeddingWireUrl(url);
      } else {
        name = "Imported Vendor";
      }
    }

    // Match detected category to DB
    const categoryId = await matchCategory(supabase, scraped.category);

    // Build notes
    const notesParts = [`Imported from ${url}`];
    if (scraped.reviewCount) {
      notesParts.push(
        `${scraped.reviewCount} reviews on ${
          source === "the_knot" ? "The Knot" : source === "wedding_wire" ? "WeddingWire" : "source"
        }`
      );
    }
    if (scraped.location) {
      notesParts.push(`Location: ${scraped.location}`);
    }

    const { data: vendor, error } = await supabase
      .from("vendors")
      .insert({
        user_id: user.id,
        name,
        website: url,
        source,
        status: "researching",
        rating: scraped.rating ? Math.round(scraped.rating) : null,
        category_id: categoryId,
        notes: notesParts.join("\n"),
      })
      .select("*, vendor_categories(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (err) {
    console.error("POST /api/vendors/import error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

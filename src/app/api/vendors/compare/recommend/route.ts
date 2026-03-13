import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import OpenAI from "openai";
import { computeScores } from "@/lib/vendor-scoring";
import type { ComparisonWeights } from "@/lib/types/comparison";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const requestSchema = z.object({
  vendorIds: z.array(z.string().uuid()).min(2).max(4),
  weights: z.object({
    price: z.number().min(0).max(100),
    rating: z.number().min(0).max(100),
    responsiveness: z.number().min(0).max(100),
    availability: z.number().min(0).max(100),
    gutFeeling: z.number().min(0).max(100),
  }),
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

    // Check subscription (pro/premium only)
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    const plan = profile?.subscription_status ?? "free";
    if (plan === "free") {
      return NextResponse.json(
        { error: "upgrade_required", feature: "comparison_ai" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { vendorIds, weights } = parsed.data;

    // Fetch vendors
    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("*, vendor_categories(name)")
      .in("id", vendorIds)
      .eq("user_id", user.id);

    if (error || !vendors || vendors.length < 2) {
      return NextResponse.json(
        { error: "Could not fetch vendors for comparison" },
        { status: 400 }
      );
    }

    // Compute scores
    const scores = computeScores(
      vendors as unknown as Parameters<typeof computeScores>[0],
      weights as ComparisonWeights
    );

    // Build prompt — cast to any[] since Supabase typed select narrows too aggressively with joins
    const vendorSummaries = (vendors as unknown as Record<string, unknown>[]).map((v) => {
      const score = scores.find((s) => s.vendorId === v.id);
      const category = (v.vendor_categories as { name: string } | null)?.name ?? "Unknown";
      return {
        id: v.id,
        name: v.name,
        category,
        quotedPrice: v.quoted_price,
        finalPrice: v.final_price,
        rating: v.rating,
        status: v.status,
        depositAmount: v.deposit_amount,
        depositPaid: v.deposit_paid,
        isBooked: v.is_booked,
        compositeScore: score?.compositeScore ?? 0,
        scoreBreakdown: score?.breakdown ?? {},
      };
    });

    const weightLabels = {
      price: "Price",
      rating: "Rating & Reviews",
      responsiveness: "Responsiveness",
      availability: "Availability",
      gutFeeling: "Gut Feeling",
    };

    const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);
    const weightSummary = Object.entries(weights)
      .map(
        ([k, v]) =>
          `${weightLabels[k as keyof typeof weightLabels]}: ${Math.round((v / totalWeight) * 100)}%`
      )
      .join(", ");

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful wedding planning assistant. Give a concise, specific recommendation for which vendor to book based on the comparison data and the couple's priorities. Be warm but direct. Mention specific trade-offs by name. Return valid JSON only.",
        },
        {
          role: "user",
          content: `Compare these vendors and recommend the best choice.

Vendors: ${JSON.stringify(vendorSummaries, null, 2)}

Couple's priorities: ${weightSummary}

Return JSON: { "summary": "2-3 sentence recommendation mentioning vendor names and specific trade-offs", "topPickId": "the vendor UUID you recommend, or null if too close to call" }`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "AI did not return a response" },
        { status: 500 }
      );
    }

    const recommendation = JSON.parse(content);

    return NextResponse.json({
      recommendation: {
        summary: recommendation.summary ?? "Unable to generate a recommendation.",
        topPickId: recommendation.topPickId ?? null,
      },
      scores,
    });
  } catch (err) {
    console.error("POST /api/vendors/compare/recommend error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

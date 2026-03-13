import type {
  ComparisonWeights,
  VendorScore,
  VendorProCon,
  CellHighlight,
} from "@/lib/types/comparison";

interface ScoringVendor {
  id: string;
  name: string;
  status: string;
  rating: number | null;
  quoted_price: number | null;
  final_price: number | null;
  deposit_amount: number | null;
  deposit_due_date: string | null;
  deposit_paid: boolean;
  is_booked: boolean;
  booked_date: string | null;
  metadata: Record<string, unknown>;
}

// ── Normalize weights to sum to 100 ──────────────────────────────────────────

export function normalizeWeights(weights: ComparisonWeights): ComparisonWeights {
  const total = Object.values(weights).reduce((sum, v) => sum + v, 0);
  if (total === 0) {
    return { price: 20, rating: 20, responsiveness: 20, availability: 20, gutFeeling: 20 };
  }
  const scale = 100 / total;
  return {
    price: weights.price * scale,
    rating: weights.rating * scale,
    responsiveness: weights.responsiveness * scale,
    availability: weights.availability * scale,
    gutFeeling: weights.gutFeeling * scale,
  };
}

// ── Individual dimension scoring ─────────────────────────────────────────────

function scorePriceDimension(vendors: ScoringVendor[]): Map<string, number> {
  const scores = new Map<string, number>();
  const prices: number[] = [];

  for (const v of vendors) {
    const price = v.final_price ?? v.quoted_price;
    if (price !== null && price > 0) prices.push(price);
  }

  if (prices.length === 0) {
    for (const v of vendors) scores.set(v.id, 50);
    return scores;
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;

  for (const v of vendors) {
    const price = v.final_price ?? v.quoted_price;
    if (price === null || price <= 0) {
      scores.set(v.id, 50); // neutral if no price
    } else if (range === 0) {
      scores.set(v.id, 75); // all same price = decent
    } else {
      // Lower price = higher score
      scores.set(v.id, Math.round(((maxPrice - price) / range) * 100));
    }
  }

  return scores;
}

function scoreRatingDimension(vendors: ScoringVendor[]): Map<string, number> {
  const scores = new Map<string, number>();
  for (const v of vendors) {
    if (v.rating !== null && v.rating > 0) {
      scores.set(v.id, Math.round((v.rating / 5) * 100));
    } else {
      scores.set(v.id, 50);
    }
  }
  return scores;
}

const STATUS_RESPONSIVENESS: Record<string, number> = {
  booked: 90,
  negotiating: 80,
  meeting_scheduled: 75,
  quoted: 65,
  contacted: 50,
  researching: 30,
  declined: 20,
  archived: 10,
};

function scoreResponsivenessDimension(vendors: ScoringVendor[]): Map<string, number> {
  const scores = new Map<string, number>();
  for (const v of vendors) {
    // Use explicit metadata value if set (1-5 scale)
    const explicit = v.metadata?.responsiveness;
    if (typeof explicit === "number" && explicit >= 1 && explicit <= 5) {
      scores.set(v.id, Math.round((explicit / 5) * 100));
    } else {
      scores.set(v.id, STATUS_RESPONSIVENESS[v.status] ?? 50);
    }
  }
  return scores;
}

function scoreAvailabilityDimension(vendors: ScoringVendor[]): Map<string, number> {
  const scores = new Map<string, number>();
  for (const v of vendors) {
    if (v.is_booked) {
      scores.set(v.id, 100);
    } else if (v.status === "declined" || v.status === "archived") {
      scores.set(v.id, 10);
    } else if (v.deposit_paid) {
      scores.set(v.id, 90);
    } else if (v.deposit_due_date) {
      // Has a deposit date set = confirmed availability
      scores.set(v.id, 75);
    } else if (v.status === "negotiating" || v.status === "meeting_scheduled") {
      scores.set(v.id, 65);
    } else {
      scores.set(v.id, 50);
    }
  }
  return scores;
}

function scoreGutFeelingDimension(vendors: ScoringVendor[]): Map<string, number> {
  const scores = new Map<string, number>();
  for (const v of vendors) {
    const explicit = v.metadata?.gutFeeling;
    if (typeof explicit === "number" && explicit >= 1 && explicit <= 5) {
      scores.set(v.id, Math.round((explicit / 5) * 100));
    } else {
      scores.set(v.id, 50); // neutral default
    }
  }
  return scores;
}

// ── Composite scoring ────────────────────────────────────────────────────────

export function computeScores(
  vendors: ScoringVendor[],
  weights: ComparisonWeights
): VendorScore[] {
  const normalized = normalizeWeights(weights);

  const priceScores = scorePriceDimension(vendors);
  const ratingScores = scoreRatingDimension(vendors);
  const responsivenessScores = scoreResponsivenessDimension(vendors);
  const availabilityScores = scoreAvailabilityDimension(vendors);
  const gutFeelingScores = scoreGutFeelingDimension(vendors);

  return vendors.map((v) => {
    const breakdown = {
      price: priceScores.get(v.id) ?? 50,
      rating: ratingScores.get(v.id) ?? 50,
      responsiveness: responsivenessScores.get(v.id) ?? 50,
      availability: availabilityScores.get(v.id) ?? 50,
      gutFeeling: gutFeelingScores.get(v.id) ?? 50,
    };

    const compositeScore = Math.round(
      (breakdown.price * normalized.price +
        breakdown.rating * normalized.rating +
        breakdown.responsiveness * normalized.responsiveness +
        breakdown.availability * normalized.availability +
        breakdown.gutFeeling * normalized.gutFeeling) /
        100
    );

    return {
      vendorId: v.id,
      compositeScore,
      breakdown,
    };
  });
}

// ── Cell highlighting ────────────────────────────────────────────────────────

export function getCellHighlight(
  values: (number | null)[],
  index: number,
  higherIsBetter: boolean
): CellHighlight {
  const validEntries = values
    .map((v, i) => ({ value: v, index: i }))
    .filter((e) => e.value !== null) as { value: number; index: number }[];

  if (validEntries.length < 2) return null;

  const sorted = [...validEntries].sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  );

  const rank = sorted.findIndex((e) => e.index === index);
  if (rank === -1) return null;
  if (rank === 0) return "best";
  if (rank === sorted.length - 1 && sorted.length > 2) return "worst";
  return "mid";
}

// ── Pros/Cons generation ─────────────────────────────────────────────────────

export function generateProsCons(
  vendors: ScoringVendor[],
  scores: VendorScore[]
): VendorProCon[] {
  const prices = vendors.map((v) => v.final_price ?? v.quoted_price);
  const ratings = vendors.map((v) => v.rating);

  const minPrice = Math.min(...prices.filter((p): p is number => p !== null && p > 0));
  const maxPrice = Math.max(...prices.filter((p): p is number => p !== null && p > 0));
  const maxRating = Math.max(...ratings.filter((r): r is number => r !== null));
  const minRating = Math.min(...ratings.filter((r): r is number => r !== null));

  const bestScoreId = scores.length > 0
    ? scores.reduce((best, s) => (s.compositeScore > best.compositeScore ? s : best)).vendorId
    : null;

  const worstScoreId = scores.length > 0
    ? scores.reduce((worst, s) => (s.compositeScore < worst.compositeScore ? s : worst)).vendorId
    : null;

  return vendors.map((v, idx) => {
    const pros: string[] = [];
    const cons: string[] = [];
    const price = v.final_price ?? v.quoted_price;
    const score = scores.find((s) => s.vendorId === v.id);

    // Price
    if (price !== null && price === minPrice && vendors.length > 1 && minPrice !== maxPrice) {
      pros.push("Lowest price");
    }
    if (price !== null && price === maxPrice && vendors.length > 1 && minPrice !== maxPrice) {
      cons.push("Highest price");
    }
    if (price === null) {
      cons.push("No price quoted yet");
    }

    // Rating
    if (v.rating !== null && v.rating === maxRating && maxRating !== minRating) {
      pros.push("Highest rated");
    }
    if (v.rating !== null && v.rating === minRating && maxRating !== minRating) {
      cons.push("Lowest rated");
    }
    if (v.rating === null) {
      cons.push("No rating yet");
    }

    // Deposit
    if (v.deposit_paid) {
      pros.push("Deposit already paid");
    }
    if (v.deposit_due_date && !v.deposit_paid) {
      const dueDate = new Date(v.deposit_due_date);
      const now = new Date();
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) {
        cons.push("Deposit overdue");
      } else if (daysUntil <= 7) {
        cons.push(`Deposit due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`);
      }
    }

    // Booking status
    if (v.is_booked) {
      pros.push("Already booked");
    }
    if (v.status === "declined") {
      cons.push("Declined");
    }

    // Overall score
    if (v.id === bestScoreId && scores.length > 1) {
      pros.push("Best overall match");
    }
    if (v.id === worstScoreId && scores.length > 2 && worstScoreId !== bestScoreId) {
      cons.push("Lowest overall score");
    }

    // Gut feeling
    const gutFeeling = v.metadata?.gutFeeling;
    if (typeof gutFeeling === "number") {
      if (gutFeeling >= 4) pros.push("Strong gut feeling");
      if (gutFeeling <= 2) cons.push("Low gut feeling");
    }

    return { vendorId: v.id, pros, cons };
  });
}

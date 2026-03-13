export interface ComparisonWeights {
  price: number;          // 0-100
  rating: number;         // 0-100
  responsiveness: number; // 0-100
  availability: number;   // 0-100
  gutFeeling: number;     // 0-100
}

export const DEFAULT_WEIGHTS: ComparisonWeights = {
  price: 30,
  rating: 25,
  responsiveness: 15,
  availability: 15,
  gutFeeling: 15,
};

export interface VendorScore {
  vendorId: string;
  compositeScore: number; // 0-100
  breakdown: Record<keyof ComparisonWeights, number>; // individual 0-100 scores
}

export interface VendorProCon {
  vendorId: string;
  pros: string[];
  cons: string[];
}

export interface AIRecommendation {
  summary: string;
  topPickId: string | null;
}

export type CellHighlight = "best" | "mid" | "worst" | null;

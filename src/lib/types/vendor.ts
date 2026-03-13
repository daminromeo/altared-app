import type { Tables } from "./database";

export type Vendor = Tables<"vendors">;
export type VendorCategory = Tables<"vendor_categories">;

export type VendorStatus =
  | "researching"
  | "contacted"
  | "meeting_scheduled"
  | "proposal_received"
  | "negotiating"
  | "booked"
  | "deposit_paid"
  | "completed"
  | "declined";

export type VendorSource =
  | "referral"
  | "instagram"
  | "google"
  | "wedding_wire"
  | "the_knot"
  | "venue_preferred"
  | "bridal_show"
  | "friend_family"
  | "other";

export interface VendorWithCategory extends Vendor {
  vendor_categories: VendorCategory | null;
}

export interface VendorFormData {
  name: string;
  category_id: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  source: VendorSource | null;
  source_url: string | null;
  status: VendorStatus;
  rating: number | null;
  notes: string | null;
  quoted_price: number | null;
  final_price: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean;
  deposit_due_date: string | null;
  is_booked: boolean;
  booked_date: string | null;
  tags: string[] | null;
}

export interface VendorSummary {
  total: number;
  byStatus: Record<VendorStatus, number>;
  byCategory: Record<string, number>;
  totalCost: number;
  totalDeposits: number;
  depositsPaid: number;
}

export interface VendorFilter {
  status?: VendorStatus | null;
  categoryId?: string | null;
  source?: VendorSource | null;
  search?: string;
}

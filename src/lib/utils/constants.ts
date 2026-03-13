export const VENDOR_STATUSES = [
  { value: "researching", label: "Researching", color: "bg-slate-100 text-slate-700" },
  { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-700" },
  { value: "meeting_scheduled", label: "Meeting Scheduled", color: "bg-purple-100 text-purple-700" },
  { value: "proposal_received", label: "Proposal Received", color: "bg-amber-100 text-amber-700" },
  { value: "negotiating", label: "Negotiating", color: "bg-orange-100 text-orange-700" },
  { value: "booked", label: "Booked", color: "bg-green-100 text-green-700" },
  { value: "deposit_paid", label: "Deposit Paid", color: "bg-emerald-100 text-emerald-700" },
  { value: "completed", label: "Completed", color: "bg-teal-100 text-teal-700" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-700" },
] as const;

export const VENDOR_SOURCES = [
  { value: "referral", label: "Referral" },
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google Search" },
  { value: "wedding_wire", label: "WeddingWire" },
  { value: "the_knot", label: "The Knot" },
  { value: "venue_preferred", label: "Venue Preferred List" },
  { value: "bridal_show", label: "Bridal Show" },
  { value: "friend_family", label: "Friend / Family" },
  { value: "other", label: "Other" },
] as const;

export const MESSAGE_SOURCES = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "text", label: "Text Message" },
  { value: "instagram", label: "Instagram DM" },
  { value: "in_person", label: "In Person" },
  { value: "other", label: "Other" },
] as const;

export const VENDOR_CATEGORIES = [
  { value: "venue", label: "Venue" },
  { value: "catering", label: "Catering" },
  { value: "photography", label: "Photography" },
  { value: "videography", label: "Videography" },
  { value: "florist", label: "Florist" },
  { value: "dj", label: "DJ" },
  { value: "band", label: "Band / Live Music" },
  { value: "planner", label: "Wedding Planner" },
  { value: "officiant", label: "Officiant" },
  { value: "hair_makeup", label: "Hair & Makeup" },
  { value: "cake", label: "Cake / Dessert" },
  { value: "transportation", label: "Transportation" },
  { value: "rentals", label: "Rentals" },
  { value: "lighting", label: "Lighting" },
  { value: "stationery", label: "Stationery / Invitations" },
  { value: "other", label: "Other" },
] as const;

export const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    vendorLimit: 10,
    proposalScans: 0,
  },
  {
    id: "pro",
    name: "Pro",
    price: 9.99,
    vendorLimit: 50,
    proposalScans: 10,
  },
  {
    id: "premium",
    name: "Premium",
    price: 19.99,
    vendorLimit: Infinity,
    proposalScans: Infinity,
  },
] as const;

export type VendorStatusValue = (typeof VENDOR_STATUSES)[number]["value"];
export type VendorSourceValue = (typeof VENDOR_SOURCES)[number]["value"];
export type MessageSourceValue = (typeof MESSAGE_SOURCES)[number]["value"];
export type VendorCategoryValue = (typeof VENDOR_CATEGORIES)[number]["value"];

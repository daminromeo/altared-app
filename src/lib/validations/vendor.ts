import { z } from "zod";

export const vendorStatusSchema = z.enum([
  "researching",
  "contacted",
  "meeting_scheduled",
  "proposal_received",
  "negotiating",
  "booked",
  "deposit_paid",
  "completed",
  "declined",
]);

export const vendorSourceSchema = z.enum([
  "referral",
  "instagram",
  "google",
  "wedding_wire",
  "the_knot",
  "venue_preferred",
  "bridal_show",
  "friend_family",
  "other",
]);

export const vendorCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Vendor name is required")
    .max(200, "Vendor name must be 200 characters or less"),
  category_id: z.string().uuid().nullable(),
  company_name: z.string().max(200).nullable(),
  email: z.string().email("Invalid email address").nullable().or(z.literal("")),
  phone: z.string().max(30).nullable(),
  website: z.string().url("Invalid URL").nullable().or(z.literal("")),
  instagram: z.string().max(100).nullable(),
  source: vendorSourceSchema.nullable(),
  source_url: z.string().url().nullable().or(z.literal("")),
  status: vendorStatusSchema.default("researching"),
  rating: z.number().min(1).max(5).nullable(),
  notes: z.string().max(5000).nullable(),
  quoted_price: z.number().min(0).nullable(),
  final_price: z.number().min(0).nullable(),
  deposit_amount: z.number().min(0).nullable(),
  deposit_paid: z.boolean().default(false),
  deposit_due_date: z.string().nullable(),
  is_booked: z.boolean().default(false),
  booked_date: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
});

export const vendorUpdateSchema = vendorCreateSchema.partial();

export type VendorCreateInput = z.infer<typeof vendorCreateSchema>;
export type VendorUpdateInput = z.infer<typeof vendorUpdateSchema>;

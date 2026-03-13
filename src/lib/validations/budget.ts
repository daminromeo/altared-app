import { z } from "zod";

export const budgetCategorySchema = z.enum([
  "venue",
  "catering",
  "photography",
  "videography",
  "florist",
  "dj",
  "band",
  "planner",
  "officiant",
  "hair_makeup",
  "cake",
  "transportation",
  "rentals",
  "lighting",
  "stationery",
  "attire",
  "favors",
  "gifts",
  "decor",
  "other",
]);

export const budgetItemCreateSchema = z.object({
  vendor_id: z.string().uuid("Invalid vendor ID").nullable(),
  category: budgetCategorySchema,
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be 500 characters or less"),
  estimated_cost: z
    .number()
    .min(0, "Estimated cost must be a positive number"),
  actual_cost: z.number().min(0).nullable(),
  paid_amount: z.number().min(0).default(0),
  is_paid: z.boolean().default(false),
  due_date: z.string().nullable(),
  notes: z.string().max(2000).nullable(),
});

export const budgetItemUpdateSchema = budgetItemCreateSchema.partial();

export const budgetTotalSchema = z.object({
  total_budget: z
    .number()
    .min(0, "Total budget must be a positive number")
    .max(10_000_000, "Budget seems unreasonably large"),
});

export type BudgetItemCreateInput = z.infer<typeof budgetItemCreateSchema>;
export type BudgetItemUpdateInput = z.infer<typeof budgetItemUpdateSchema>;
export type BudgetTotalInput = z.infer<typeof budgetTotalSchema>;

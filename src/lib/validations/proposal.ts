import { z } from "zod";

export const paymentScheduleItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0, "Amount must be positive"),
  dueDate: z.string().nullable(),
});

export const proposalScanResultSchema = z.object({
  vendorName: z.string().nullable(),
  vendorEmail: z.string().email().nullable().or(z.literal("")),
  vendorPhone: z.string().nullable(),
  vendorWebsite: z.string().url().nullable().or(z.literal("")),
  category: z.string().nullable(),
  totalCost: z.number().nullable(),
  depositAmount: z.number().nullable(),
  depositDueDate: z.string().nullable(),
  paymentSchedule: z.array(paymentScheduleItemSchema),
  services: z.array(z.string()),
  eventDate: z.string().nullable(),
  eventLocation: z.string().nullable(),
  cancellationPolicy: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export const proposalCreateSchema = z.object({
  vendor_id: z.string().uuid("Invalid vendor ID").nullable(),
  file_url: z.string().url("File URL is required"),
  file_name: z.string().min(1, "File name is required"),
  file_size: z.number().min(0).nullable(),
  extracted_total_price: z.number().min(0).nullable(),
  extracted_deposit_amount: z.number().min(0).nullable(),
  extracted_deposit_due_date: z.string().nullable(),
  extracted_services: z.array(z.string()).nullable(),
  extracted_payment_schedule: z.array(paymentScheduleItemSchema).nullable(),
  extracted_notes: z.string().max(5000).nullable(),
});

export const proposalUpdateSchema = proposalCreateSchema.partial();

export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;
export type ProposalUpdateInput = z.infer<typeof proposalUpdateSchema>;
export type PaymentScheduleItemInput = z.infer<typeof paymentScheduleItemSchema>;

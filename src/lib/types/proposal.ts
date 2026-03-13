import type { Tables } from "./database";
import type { VendorWithCategory } from "./vendor";

export type Proposal = Tables<"proposals">;

export interface ProposalWithVendor extends Proposal {
  vendors: VendorWithCategory | null;
}

export type ProposalScanStatus = "pending" | "scanning" | "completed" | "failed";

export interface ProposalPaymentScheduleItem {
  description: string;
  amount: number;
  dueDate: string | null;
}

export interface ProposalScanResult {
  vendorName: string | null;
  vendorEmail: string | null;
  vendorPhone: string | null;
  vendorWebsite: string | null;
  category: string | null;
  totalCost: number | null;
  depositAmount: number | null;
  depositDueDate: string | null;
  paymentSchedule: ProposalPaymentScheduleItem[];
  services: string[];
  eventDate: string | null;
  eventLocation: string | null;
  cancellationPolicy: string | null;
  notes: string | null;
  confidence: number;
}

export interface ProposalFormData {
  vendor_id: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  extracted_total_price: number | null;
  extracted_deposit_amount: number | null;
  extracted_deposit_due_date: string | null;
  extracted_services: string[] | null;
  extracted_payment_schedule: ProposalPaymentScheduleItem[] | null;
  extracted_notes: string | null;
}

export interface ProposalUploadState {
  file: File | null;
  isUploading: boolean;
  isScanning: boolean;
  progress: number;
  scanResult: ProposalScanResult | null;
  error: string | null;
}

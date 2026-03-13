import {
  format,
  formatDistanceToNow,
  differenceInDays,
  parseISO,
  isValid,
} from "date-fns";

/**
 * Format a number as USD currency.
 */
export function formatCurrency(
  amount: number,
  options?: {
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: options?.currency ?? "USD",
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(amount);
}

/**
 * Format a date string or Date object into a human-readable format.
 * Default format: "MMM d, yyyy" (e.g., "Jan 15, 2026")
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = "MMM d, yyyy"
): string {
  if (!date) return "";

  const parsed = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(parsed)) return "";

  return format(parsed, formatStr);
}

/**
 * Format a date as a relative time string (e.g., "2 days ago", "in 3 hours").
 */
export function formatRelativeDate(
  date: string | Date | null | undefined
): string {
  if (!date) return "";

  const parsed = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(parsed)) return "";

  return formatDistanceToNow(parsed, { addSuffix: true });
}

/**
 * Calculate the number of days until a given date.
 * Returns a negative number if the date is in the past.
 */
export function daysUntil(date: string | Date | null | undefined): number {
  if (!date) return 0;

  const parsed = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(parsed)) return 0;

  return differenceInDays(parsed, new Date());
}

/**
 * Format a phone number string into (xxx) xxx-xxxx format.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Format a percentage with specified decimal places.
 */
export function formatPercent(
  value: number,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}%`;
}

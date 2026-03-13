import type { Tables } from "./database";

export type BudgetItem = Tables<"budget_items">;

export interface BudgetItemWithCategory extends BudgetItem {
  vendors: {
    id: string;
    name: string;
    category_id: string | null;
    vendor_categories: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
}

export interface BudgetSummary {
  totalBudget: number;
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  totalRemaining: number;
  percentUsed: number;
  overBudget: boolean;
  overBudgetAmount: number;
}

export interface BudgetCategoryBreakdown {
  category: string;
  categoryLabel: string;
  estimatedTotal: number;
  actualTotal: number;
  paidTotal: number;
  itemCount: number;
  percentOfBudget: number;
}

export interface BudgetFormData {
  vendor_id: string | null;
  category: string;
  description: string;
  estimated_cost: number;
  actual_cost: number | null;
  paid_amount: number;
  is_paid: boolean;
  due_date: string | null;
  notes: string | null;
}

export interface BudgetChartData {
  category: string;
  estimated: number;
  actual: number;
  paid: number;
}

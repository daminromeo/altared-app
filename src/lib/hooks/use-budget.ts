import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  BudgetItemWithCategory,
  BudgetSummary,
  BudgetFormData,
} from "@/lib/types/budget";

const BUDGET_KEY = "budget-items";
const BUDGET_SUMMARY_KEY = "budget-summary";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetches budget items, optionally filtered by category.
 */
export function useBudgetItems(categoryId?: string | null) {
  const params = categoryId ? `?categoryId=${categoryId}` : "";

  return useQuery<BudgetItemWithCategory[]>({
    queryKey: [BUDGET_KEY, categoryId ?? "all"],
    queryFn: () =>
      fetchJson<BudgetItemWithCategory[]>(`/api/budget${params}`),
  });
}

/**
 * Fetches the computed budget summary (total, committed, paid, remaining).
 */
export function useBudgetSummary() {
  return useQuery<BudgetSummary>({
    queryKey: [BUDGET_SUMMARY_KEY],
    queryFn: () => fetchJson<BudgetSummary>("/api/budget/summary"),
  });
}

/**
 * Creates a new budget item.
 */
export function useCreateBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation<BudgetItemWithCategory, Error, BudgetFormData>({
    mutationFn: (data) =>
      fetchJson<BudgetItemWithCategory>("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGET_KEY] });
      queryClient.invalidateQueries({ queryKey: [BUDGET_SUMMARY_KEY] });
    },
  });
}

/**
 * Updates an existing budget item.
 */
export function useUpdateBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation<
    BudgetItemWithCategory,
    Error,
    { id: string; data: Partial<BudgetFormData> }
  >({
    mutationFn: ({ id, data }) =>
      fetchJson<BudgetItemWithCategory>(`/api/budget/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGET_KEY] });
      queryClient.invalidateQueries({ queryKey: [BUDGET_SUMMARY_KEY] });
    },
  });
}

/**
 * Deletes a budget item.
 */
export function useDeleteBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      fetchJson<void>(`/api/budget/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGET_KEY] });
      queryClient.invalidateQueries({ queryKey: [BUDGET_SUMMARY_KEY] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  VendorWithCategory,
  VendorFormData,
  VendorFilter,
} from "@/lib/types/vendor";

const VENDORS_KEY = "vendors";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

function buildVendorQueryString(filters?: VendorFilter): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.source) params.set("source", filters.source);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Fetches the vendor list with optional filters.
 */
export function useVendors(filters?: VendorFilter) {
  return useQuery<VendorWithCategory[]>({
    queryKey: [VENDORS_KEY, filters],
    queryFn: () =>
      fetchJson<VendorWithCategory[]>(
        `/api/vendors${buildVendorQueryString(filters)}`
      ),
  });
}

/**
 * Fetches a single vendor by id.
 */
export function useVendor(id: string | null | undefined) {
  return useQuery<VendorWithCategory>({
    queryKey: [VENDORS_KEY, id],
    queryFn: () => fetchJson<VendorWithCategory>(`/api/vendors/${id}`),
    enabled: !!id,
  });
}

/**
 * Creates a new vendor.
 */
export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation<VendorWithCategory, Error, VendorFormData>({
    mutationFn: (data) =>
      fetchJson<VendorWithCategory>("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENDORS_KEY] });
    },
  });
}

/**
 * Updates an existing vendor.
 */
export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation<
    VendorWithCategory,
    Error,
    { id: string; data: Partial<VendorFormData> }
  >({
    mutationFn: ({ id, data }) =>
      fetchJson<VendorWithCategory>(`/api/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: [VENDORS_KEY] });
      queryClient.invalidateQueries({ queryKey: [VENDORS_KEY, id] });
    },
  });
}

/**
 * Deletes a vendor.
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      fetchJson<void>(`/api/vendors/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENDORS_KEY] });
    },
  });
}

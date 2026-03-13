import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ProposalWithVendor,
  ProposalFormData,
  ProposalScanResult,
} from "@/lib/types/proposal";

const PROPOSALS_KEY = "proposals";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface ProposalFilter {
  vendorId?: string | null;
  scanStatus?: string | null;
  search?: string;
}

function buildProposalQueryString(filters?: ProposalFilter): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.vendorId) params.set("vendorId", filters.vendorId);
  if (filters.scanStatus) params.set("scanStatus", filters.scanStatus);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Fetches the proposals list with optional filters.
 */
export function useProposals(filters?: ProposalFilter) {
  return useQuery<ProposalWithVendor[]>({
    queryKey: [PROPOSALS_KEY, filters],
    queryFn: () =>
      fetchJson<ProposalWithVendor[]>(
        `/api/proposals${buildProposalQueryString(filters)}`
      ),
  });
}

/**
 * Fetches a single proposal by id.
 */
export function useProposal(id: string | null | undefined) {
  return useQuery<ProposalWithVendor>({
    queryKey: [PROPOSALS_KEY, id],
    queryFn: () => fetchJson<ProposalWithVendor>(`/api/proposals/${id}`),
    enabled: !!id,
  });
}

interface UploadProposalParams {
  file: File;
  vendorId?: string | null;
}

interface UploadResult {
  proposal: ProposalWithVendor;
  fileUrl: string;
}

/**
 * Uploads a file and creates a proposal record.
 * Sends the file as FormData, the API route handles storage upload + record creation.
 */
export function useUploadProposal() {
  const queryClient = useQueryClient();

  return useMutation<UploadResult, Error, UploadProposalParams>({
    mutationFn: async ({ file, vendorId }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (vendorId) formData.append("vendorId", vendorId);

      const res = await fetch("/api/proposals/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Upload failed");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
    },
  });
}

interface ScanProposalResult {
  scanResult: ProposalScanResult;
  proposal: ProposalWithVendor;
}

/**
 * Triggers an AI scan on a proposal.
 */
export function useScanProposal() {
  const queryClient = useQueryClient();

  return useMutation<ScanProposalResult, Error, string>({
    mutationFn: (proposalId) =>
      fetchJson<ScanProposalResult>(`/api/proposals/${proposalId}/scan`, {
        method: "POST",
      }),
    onSuccess: (_result, proposalId) => {
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PROPOSALS_KEY, proposalId],
      });
    },
  });
}

/**
 * Updates proposal data (notes, costs, vendor assignment, etc).
 */
export function useUpdateProposal() {
  const queryClient = useQueryClient();

  return useMutation<
    ProposalWithVendor,
    Error,
    { id: string; data: Partial<ProposalFormData> }
  >({
    mutationFn: ({ id, data }) =>
      fetchJson<ProposalWithVendor>(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY, id] });
    },
  });
}

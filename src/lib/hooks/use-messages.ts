import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database";

const MESSAGES_KEY = "messages";

type Message = Tables<"messages">;

interface MessageWithVendor extends Message {
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

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface MessageFilter {
  vendorId?: string | null;
  direction?: "inbound" | "outbound" | null;
  source?: string | null;
  isRead?: boolean | null;
  search?: string;
}

function buildMessageQueryString(filters?: MessageFilter): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.vendorId) params.set("vendorId", filters.vendorId);
  if (filters.direction) params.set("direction", filters.direction);
  if (filters.source) params.set("source", filters.source);
  if (filters.isRead !== null && filters.isRead !== undefined)
    params.set("isRead", String(filters.isRead));
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Fetches messages with optional filters.
 */
export function useMessages(filters?: MessageFilter) {
  return useQuery<MessageWithVendor[]>({
    queryKey: [MESSAGES_KEY, filters],
    queryFn: () =>
      fetchJson<MessageWithVendor[]>(
        `/api/messages${buildMessageQueryString(filters)}`
      ),
  });
}

/**
 * Fetches the message thread with a specific vendor, ordered by sent_at.
 */
export function useMessageThread(vendorId: string | null | undefined) {
  return useQuery<MessageWithVendor[]>({
    queryKey: [MESSAGES_KEY, "thread", vendorId],
    queryFn: () =>
      fetchJson<MessageWithVendor[]>(
        `/api/messages?vendorId=${vendorId}&sort=sent_at&order=asc`
      ),
    enabled: !!vendorId,
  });
}

export interface CreateMessageData {
  vendor_id: string;
  direction: "inbound" | "outbound";
  source: string;
  subject?: string | null;
  body: string;
  sent_at?: string;
}

/**
 * Creates a message (manual log entry).
 */
export function useCreateMessage() {
  const queryClient = useQueryClient();

  return useMutation<MessageWithVendor, Error, CreateMessageData>({
    mutationFn: (data) =>
      fetchJson<MessageWithVendor>("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [MESSAGES_KEY, "thread", variables.vendor_id],
      });
    },
  });
}

export interface UpdateMessageData {
  is_read?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Updates a message (mark read/unread, star, etc).
 */
export function useUpdateMessage() {
  const queryClient = useQueryClient();

  return useMutation<
    MessageWithVendor,
    Error,
    { id: string; data: UpdateMessageData }
  >({
    mutationFn: ({ id, data }) =>
      fetchJson<MessageWithVendor>(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY] });
    },
  });
}

export type { MessageWithVendor };

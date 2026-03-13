import type { Tables } from "./database";

export type Message = Tables<"messages">;

export type MessageDirection = "inbound" | "outbound";

export type MessageSource =
  | "email"
  | "phone"
  | "text"
  | "instagram"
  | "in_person"
  | "the_knot"
  | "wedding_wire"
  | "other";

export const MESSAGE_SOURCES: { value: MessageSource; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Call" },
  { value: "text", label: "Text / SMS" },
  { value: "instagram", label: "Instagram" },
  { value: "the_knot", label: "The Knot" },
  { value: "wedding_wire", label: "WeddingWire" },
  { value: "in_person", label: "In Person" },
  { value: "other", label: "Other" },
];

export interface MessageWithVendor extends Message {
  vendors: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    category_id: string | null;
    vendor_categories: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
}

export interface MessageThread {
  vendorId: string;
  vendorName: string;
  vendorCategory: string | null;
  lastMessage: Message;
  messageCount: number;
  unreadCount: number;
}

export interface MessageFormData {
  vendor_id: string;
  direction: MessageDirection;
  source: MessageSource;
  subject: string | null;
  body: string;
  sent_at: string;
}

export interface MessageFilter {
  vendorId?: string | null;
  direction?: MessageDirection | null;
  source?: MessageSource | null;
  search?: string;
  isRead?: boolean | null;
}

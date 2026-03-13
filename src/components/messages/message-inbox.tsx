"use client";

import { cn } from "@/lib/utils";
import { MessageSourceBadge } from "./message-source-badge";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface MessageItem {
  id: string;
  vendor_id: string;
  vendor_name: string;
  direction: "inbound" | "outbound";
  source: "email" | "phone" | "text" | "instagram" | "in_person" | "the_knot" | "wedding_wire" | "other";
  subject: string | null;
  body: string;
  sent_at: string;
  is_read: boolean;
  is_starred: boolean;
}

interface MessageInboxProps {
  messages: MessageItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleStar?: (id: string, starred: boolean) => void;
}

export function MessageInbox({
  messages,
  selectedId,
  onSelect,
  onToggleStar,
}: MessageInboxProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <p className="text-sm font-medium text-[#2D2D2D]">No entries yet</p>
          <p className="mt-1 text-xs text-[#7A7A7A]">
            Log your vendor conversations to keep everything in one place
          </p>
        </div>
      </div>
    );
  }

  // Group messages by vendor
  const grouped = messages.reduce<
    Record<string, { vendorName: string; messages: MessageItem[] }>
  >((acc, msg) => {
    if (!acc[msg.vendor_id]) {
      acc[msg.vendor_id] = { vendorName: msg.vendor_name, messages: [] };
    }
    acc[msg.vendor_id].messages.push(msg);
    return acc;
  }, {});

  // Sort groups by latest message date (descending)
  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    const latestA = a[1].messages[0]?.sent_at ?? "";
    const latestB = b[1].messages[0]?.sent_at ?? "";
    return latestB.localeCompare(latestA);
  });

  return (
    <div className="flex flex-col divide-y divide-gray-100 overflow-y-auto">
      {sortedGroups.map(([vendorId, group]) => (
        <div key={vendorId}>
          <div className="sticky top-0 z-10 border-b border-gray-100 bg-[#FAF8F5] px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#7A7A7A]">
              {group.vendorName}
            </span>
          </div>
          {group.messages.map((message) => (
            <button
              key={message.id}
              type="button"
              onClick={() => onSelect(message.id)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FAF8F5]",
                selectedId === message.id && "bg-[#8B9F82]/10",
                !message.is_read && "bg-white"
              )}
            >
              {/* Unread indicator */}
              <div className="mt-2 shrink-0">
                {!message.is_read ? (
                  <div className="size-2 rounded-full bg-[#8B9F82]" />
                ) : (
                  <div className="size-2" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-sm",
                      !message.is_read
                        ? "font-semibold text-[#2D2D2D]"
                        : "font-medium text-[#2D2D2D]"
                    )}
                  >
                    {message.subject ?? "(No subject)"}
                  </span>
                  <span className="shrink-0 text-[11px] text-[#7A7A7A]">
                    {formatDistanceToNow(new Date(message.sent_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <p className="mt-0.5 truncate text-xs text-[#7A7A7A]">
                  {message.body}
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <MessageSourceBadge source={message.source} />
                  {message.direction === "outbound" && (
                    <span className="text-[11px] text-[#7A7A7A]">Sent</span>
                  )}
                </div>
              </div>

              {/* Star */}
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar?.(message.id, !message.is_starred);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleStar?.(message.id, !message.is_starred);
                  }
                }}
                className="mt-0.5 shrink-0 cursor-pointer p-0.5 transition-colors hover:text-[#C9A96E]"
              >
                <Star
                  className={cn(
                    "size-4",
                    message.is_starred
                      ? "fill-[#C9A96E] text-[#C9A96E]"
                      : "text-gray-300"
                  )}
                />
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

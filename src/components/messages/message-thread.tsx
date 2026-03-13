"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageSourceBadge } from "./message-source-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { format } from "date-fns";

export interface ThreadMessage {
  id: string;
  vendor_id: string;
  vendor_name: string;
  direction: "inbound" | "outbound";
  source: "email" | "phone" | "text" | "instagram" | "in_person" | "the_knot" | "wedding_wire" | "other";
  subject: string | null;
  body: string;
  sent_at: string;
  is_read: boolean;
}

interface MessageThreadProps {
  messages: ThreadMessage[];
  vendorName: string;
  onSendReply?: (body: string) => void;
  isSending?: boolean;
}

export function MessageThread({
  messages,
  vendorName,
  onSendReply,
  isSending = false,
}: MessageThreadProps) {
  const [replyText, setReplyText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = replyText.trim();
    if (!trimmed || isSending) return;
    onSendReply?.(trimmed);
    setReplyText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <p className="text-sm font-medium text-[#2D2D2D]">
            Select a conversation
          </p>
          <p className="mt-1 text-xs text-[#7A7A7A]">
            Choose a vendor from the list to view the communication history
          </p>
        </div>
      </div>
    );
  }

  // Sort chronologically (oldest first)
  const sorted = [...messages].sort(
    (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
  );

  return (
    <div className="flex h-full flex-col">
      {/* Thread header */}
      <div className="shrink-0 border-b border-gray-100 px-6 py-4">
        <h2 className="text-base font-semibold text-[#2D2D2D]">
          {vendorName}
        </h2>
        {sorted[0]?.subject && (
          <p className="mt-0.5 text-sm text-[#7A7A7A]">{sorted[0].subject}</p>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {sorted.map((message) => {
          const isOutbound = message.direction === "outbound";
          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                isOutbound ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  isOutbound
                    ? "rounded-br-md bg-[#8B9F82]/15 text-[#2D2D2D]"
                    : "rounded-bl-md bg-white text-[#2D2D2D] ring-1 ring-gray-100"
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-[#2D2D2D]">
                    {isOutbound ? "You" : message.vendor_name}
                  </span>
                  <MessageSourceBadge source={message.source} />
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2D2D2D]">
                  {message.body}
                </p>
                <p className="mt-2 text-[11px] text-[#7A7A7A]">
                  {format(new Date(message.sent_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply input for manual logging */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4">
        <div className="flex items-end gap-3">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Log a note or message... (Cmd+Enter to save)"
            className="min-h-[60px] resize-none rounded-xl border-gray-200 bg-[#FAF8F5] text-sm focus-visible:ring-[#8B9F82]"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!replyText.trim() || isSending}
            size="icon"
            className="shrink-0 rounded-xl bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-[#7A7A7A]">
          Add a note or log a conversation for your records
        </p>
      </div>
    </div>
  );
}

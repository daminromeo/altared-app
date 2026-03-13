"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageInbox, type MessageItem } from "@/components/messages/message-inbox";
import {
  MessageThread,
  type ThreadMessage,
} from "@/components/messages/message-thread";
import { MessageSourceBadge } from "@/components/messages/message-source-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Filter,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SourceFilter = "all" | "email" | "phone" | "text" | "instagram" | "in_person" | "the_knot" | "wedding_wire" | "other";
type ReadFilter = "all" | "read" | "unread";

interface VendorOption {
  id: string;
  name: string;
}

export default function MessagesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Log message dialog
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logVendorId, setLogVendorId] = useState("");
  const [logSubject, setLogSubject] = useState("");
  const [logBody, setLogBody] = useState("");
  const [logDirection, setLogDirection] = useState<"inbound" | "outbound">(
    "inbound"
  );
  const [logSource, setLogSource] = useState<SourceFilter>("email");
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Mobile view state
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (vendorFilter !== "all") params.set("vendor_id", vendorFilter);
      if (readFilter === "read") params.set("is_read", "true");
      if (readFilter === "unread") params.set("is_read", "false");

      const res = await fetch(`/api/messages?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();

      const mapped: MessageItem[] = (data.messages ?? []).map(
        (msg: Record<string, unknown>) => ({
          id: msg.id as string,
          vendor_id: msg.vendor_id as string,
          vendor_name:
            (msg.vendors as Record<string, unknown> | null)?.name ?? "Unknown Vendor",
          direction: msg.direction as "inbound" | "outbound",
          source: msg.source as MessageItem["source"],
          subject: msg.subject as string | null,
          body: msg.body as string,
          sent_at: (msg.received_at ?? msg.sent_at ?? msg.created_at) as string,
          is_read: msg.is_read as boolean,
          is_starred:
            ((msg.metadata as Record<string, unknown> | null)?.starred as boolean) ??
            false,
        })
      );

      setMessages(mapped);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, vendorFilter, readFilter]);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch("/api/vendors");
      if (!res.ok) return;
      const data = await res.json();
      setVendors(
        (data.vendors ?? []).map((v: Record<string, unknown>) => ({
          id: v.id as string,
          name: v.name as string,
        }))
      );
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchVendors();
  }, [fetchMessages, fetchVendors]);

  // Load thread when a message is selected
  useEffect(() => {
    if (!selectedId) {
      setThreadMessages([]);
      return;
    }

    const selected = messages.find((m) => m.id === selectedId);
    if (!selected) return;

    // Get all messages for the same vendor as a thread
    const thread: ThreadMessage[] = messages
      .filter((m) => m.vendor_id === selected.vendor_id)
      .map((m) => ({
        id: m.id,
        vendor_id: m.vendor_id,
        vendor_name: m.vendor_name,
        direction: m.direction,
        source: m.source,
        subject: m.subject,
        body: m.body,
        sent_at: m.sent_at,
        is_read: m.is_read,
      }));

    setThreadMessages(thread);

    // Mark selected message as read
    if (!selected.is_read) {
      fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, is_read: true }),
      }).then(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === selectedId ? { ...m, is_read: true } : m))
        );
      });
    }
  }, [selectedId, messages]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileShowThread(true);
  };

  const handleToggleStar = async (id: string, starred: boolean) => {
    try {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          metadata: { starred },
        }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_starred: starred } : m))
      );
    } catch {
      // silently fail
    }
  };

  const handleSendReply = async (body: string) => {
    const selected = messages.find((m) => m.id === selectedId);
    if (!selected) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: selected.vendor_id,
          direction: "outbound",
          source: selected.source,
          subject: selected.subject,
          body,
        }),
      });

      if (!res.ok) throw new Error("Failed to send");
      await fetchMessages();
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleLogMessage = async () => {
    if (!logVendorId || !logBody.trim()) return;
    setIsSubmittingLog(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: logVendorId,
          direction: logDirection,
          source: logSource === "all" ? "other" : logSource,
          subject: logSubject || null,
          body: logBody.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to log message");

      setLogDialogOpen(false);
      setLogVendorId("");
      setLogSubject("");
      setLogBody("");
      setLogDirection("inbound");
      setLogSource("email");
      await fetchMessages();
    } catch (err) {
      console.error("Error logging message:", err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Apply search filter client-side
  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.vendor_name.toLowerCase().includes(q) ||
      (m.subject?.toLowerCase().includes(q) ?? false) ||
      m.body.toLowerCase().includes(q)
    );
  });

  const selectedMessage = messages.find((m) => m.id === selectedId);
  const selectedVendorName = selectedMessage?.vendor_name ?? "";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Page header */}
      <div className="shrink-0 border-b border-gray-100 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="size-5 text-[#8B9F82]" />
            <div>
              <h1 className="text-xl font-semibold text-[#2D2D2D]">Communication Log</h1>
              <p className="text-xs text-[#7A7A7A]">Track conversations with your vendors across all channels</p>
            </div>
          </div>
          <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2 rounded-lg bg-[#8B9F82] text-white hover:bg-[#7A8E71]" />
              }
            >
              <Plus className="size-4" />
              Log Entry
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log Communication</DialogTitle>
                <DialogDescription>
                  Record a conversation or interaction with a vendor.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="log-vendor">Vendor</Label>
                  <Select value={logVendorId} onValueChange={(v) => setLogVendorId(v ?? '')}>
                    <SelectTrigger id="log-vendor">
                      <SelectValue placeholder="Select vendor">
                        {(value: string) => vendors.find((v) => v.id === value)?.name ?? value}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id} label={v.name}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="log-direction">Direction</Label>
                    <Select
                      value={logDirection}
                      onValueChange={(v) =>
                        setLogDirection((v ?? "inbound") as "inbound" | "outbound")
                      }
                    >
                      <SelectTrigger id="log-direction">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound">Received</SelectItem>
                        <SelectItem value="outbound">Sent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="log-source">Channel</Label>
                    <Select
                      value={logSource}
                      onValueChange={(v) => setLogSource((v ?? "email") as SourceFilter)}
                    >
                      <SelectTrigger id="log-source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="text">Text / SMS</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="the_knot">The Knot</SelectItem>
                        <SelectItem value="wedding_wire">WeddingWire</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="log-subject">Subject (optional)</Label>
                  <Input
                    id="log-subject"
                    value={logSubject}
                    onChange={(e) => setLogSubject(e.target.value)}
                    placeholder="Message subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="log-body">Message</Label>
                  <Textarea
                    id="log-body"
                    value={logBody}
                    onChange={(e) => setLogBody(e.target.value)}
                    placeholder="Type the message content..."
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleLogMessage}
                  disabled={!logVendorId || !logBody.trim() || isSubmittingLog}
                  className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
                >
                  {isSubmittingLog ? "Saving..." : "Save Message"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters row */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7A7A7A]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="pl-9 bg-[#FAF8F5] border-gray-200 rounded-lg"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "gap-1.5 rounded-lg",
              showFilters && "bg-[#8B9F82]/10 border-[#8B9F82]"
            )}
          >
            <Filter className="size-3.5" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Select
              value={sourceFilter}
              onValueChange={(v) => setSourceFilter((v ?? "all") as SourceFilter)}
            >
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="text">Text / SMS</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="the_knot">The Knot</SelectItem>
                <SelectItem value="wedding_wire">WeddingWire</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={vendorFilter}
              onValueChange={(v) => setVendorFilter(v ?? "all")}
            >
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Vendor">
                  {(value: string) => {
                    if (value === 'all') return 'All Vendors'
                    return vendors.find((v) => v.id === value)?.name ?? value
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id} label={v.name}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={readFilter}
              onValueChange={(v) => setReadFilter((v ?? "all") as ReadFilter)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Main content area */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-[#8B9F82] border-t-transparent" />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: inbox list */}
          <div
            className={cn(
              "w-full border-r border-gray-100 bg-white md:w-[380px] md:block",
              mobileShowThread ? "hidden" : "block"
            )}
          >
            <MessageInbox
              messages={filteredMessages}
              selectedId={selectedId}
              onSelect={handleSelect}
              onToggleStar={handleToggleStar}
            />
          </div>

          {/* Right panel: thread view */}
          <div
            className={cn(
              "flex-1 bg-[#FAF8F5] md:block",
              mobileShowThread ? "block" : "hidden"
            )}
          >
            {/* Mobile back button */}
            {mobileShowThread && (
              <div className="border-b border-gray-100 bg-white px-4 py-2 md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMobileShowThread(false);
                    setSelectedId(null);
                  }}
                  className="gap-1.5 text-[#7A7A7A]"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              </div>
            )}
            <MessageThread
              messages={threadMessages}
              vendorName={selectedVendorName}
              onSendReply={handleSendReply}
              isSending={isSending}
            />
          </div>
        </div>
      )}
    </div>
  );
}

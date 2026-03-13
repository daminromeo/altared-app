"use client";

import { useState, useEffect, useCallback } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Reaction {
  id: string;
  vendor_id: string;
  partner_name: string;
  reaction: string;
  comment: string | null;
  updated_at: string;
  vendors?: { id: string; name: string; company_name: string | null } | null;
}

interface PartnerFeedbackPanelProps {
  vendorId?: string;
}

export function PartnerFeedbackPanel({ vendorId }: PartnerFeedbackPanelProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReactions = useCallback(async () => {
    try {
      const res = await fetch("/api/share/reactions");
      if (res.ok) {
        const data = await res.json();
        const all: Reaction[] = data.reactions ?? [];
        setReactions(
          vendorId ? all.filter((r) => r.vendor_id === vendorId) : all
        );
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  if (loading || reactions.length === 0) return null;

  return (
    <Card className="border-[#E8E4DF]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-[#2D2D2D]">
          <Users className="h-4 w-4 text-[#8B9F82]" />
          Partner Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-3 rounded-lg border border-[#E8E4DF] p-3"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  r.reaction === "thumbs_up"
                    ? "bg-green-50"
                    : "bg-red-50"
                }`}
              >
                {r.reaction === "thumbs_up" ? (
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                ) : (
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#2D2D2D]">
                    {r.partner_name}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      r.reaction === "thumbs_up"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {r.reaction === "thumbs_up" ? "Loves it" : "Not sure"}
                  </span>
                  {!vendorId && r.vendors && (
                    <span className="text-xs text-[#7A7A7A]">
                      on {(r.vendors as { name: string }).name}
                    </span>
                  )}
                </div>
                {r.comment && (
                  <div className="mt-1 flex items-start gap-1">
                    <MessageCircle className="mt-0.5 h-3 w-3 shrink-0 text-[#7A7A7A]" />
                    <p className="text-sm text-[#7A7A7A]">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

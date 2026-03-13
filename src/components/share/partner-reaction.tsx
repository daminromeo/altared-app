"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PartnerReactionProps {
  vendorId: string;
  token: string;
  partnerName: string;
  existingReaction?: {
    reaction: string;
    comment: string | null;
  } | null;
  onReacted: (vendorId: string, reaction: string, comment: string | null) => void;
}

export function PartnerReaction({
  vendorId,
  token,
  partnerName,
  existingReaction,
  onReacted,
}: PartnerReactionProps) {
  const [reaction, setReaction] = useState<string | null>(
    existingReaction?.reaction ?? null
  );
  const [comment, setComment] = useState(existingReaction?.comment ?? "");
  const [showComment, setShowComment] = useState(!!existingReaction?.comment);
  const [saving, setSaving] = useState(false);

  async function submitReaction(newReaction: string) {
    // Toggle off if same reaction
    if (reaction === newReaction && !comment) {
      setReaction(null);
      return;
    }

    setSaving(true);
    setReaction(newReaction);

    try {
      const res = await fetch(`/api/share/${token}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          partnerName,
          reaction: newReaction,
          comment: comment || undefined,
        }),
      });

      if (res.ok) {
        onReacted(vendorId, newReaction, comment || null);
      }
    } catch {
      // Revert on error
      setReaction(existingReaction?.reaction ?? null);
    } finally {
      setSaving(false);
    }
  }

  async function submitComment() {
    if (!reaction) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/share/${token}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          partnerName,
          reaction,
          comment: comment || undefined,
        }),
      });

      if (res.ok) {
        onReacted(vendorId, reaction, comment || null);
        setShowComment(false);
      }
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => submitReaction("thumbs_up")}
          disabled={saving}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            reaction === "thumbs_up"
              ? "bg-green-100 text-green-700 ring-1 ring-green-300"
              : "bg-[#FAF8F5] text-[#7A7A7A] hover:bg-green-50 hover:text-green-600"
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          Love it
        </button>
        <button
          onClick={() => submitReaction("thumbs_down")}
          disabled={saving}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            reaction === "thumbs_down"
              ? "bg-red-100 text-red-700 ring-1 ring-red-300"
              : "bg-[#FAF8F5] text-[#7A7A7A] hover:bg-red-50 hover:text-red-600"
          }`}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          Not sure
        </button>
        {reaction && !showComment && (
          <button
            onClick={() => setShowComment(true)}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-[#7A7A7A] hover:bg-[#FAF8F5]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {existingReaction?.comment ? "Edit note" : "Add note"}
          </button>
        )}
      </div>

      {showComment && (
        <div className="flex items-start gap-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 280))}
            placeholder="Share your thoughts... (optional)"
            maxLength={280}
            rows={2}
            className="flex-1 rounded-lg border border-[#E8E4DF] bg-white px-3 py-2 text-sm text-[#2D2D2D] placeholder:text-[#7A7A7A]/60 focus:border-[#8B9F82] focus:outline-none focus:ring-1 focus:ring-[#8B9F82]"
          />
          <div className="flex flex-col gap-1">
            <Button
              onClick={submitComment}
              disabled={saving}
              className="h-8 bg-[#8B9F82] px-3 text-xs text-white hover:bg-[#7A8E71]"
            >
              Save
            </Button>
            <button
              onClick={() => setShowComment(false)}
              className="flex h-8 items-center justify-center text-[#7A7A7A] hover:text-[#2D2D2D]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {!showComment && existingReaction?.comment && (
        <p className="text-xs italic text-[#7A7A7A]">
          &ldquo;{existingReaction.comment}&rdquo;
        </p>
      )}
    </div>
  );
}

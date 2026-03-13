"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart } from "lucide-react";

interface PartnerNameGateProps {
  weddingName?: string | null;
  sharedBy?: string | null;
  onSubmit: (name: string) => void;
}

export function PartnerNameGate({
  weddingName,
  sharedBy,
  onSubmit,
}: PartnerNameGateProps) {
  const [name, setName] = useState("");

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#8B9F82]/10">
            <Heart className="h-8 w-8 text-[#8B9F82]" />
          </div>
          <h1
            className="mt-4 text-3xl font-bold text-[#2D2D2D]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {weddingName ?? "Wedding Planning"}
          </h1>
          {sharedBy && (
            <p className="mt-2 text-[#7A7A7A]">
              Shared by {sharedBy}
            </p>
          )}
        </div>

        {/* Name form */}
        <div className="rounded-xl border border-[#E8E4DF] bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-[#2D2D2D]">
            Welcome! What&apos;s your name?
          </h2>
          <p className="mt-1 text-sm text-[#7A7A7A]">
            This helps the couple know who left feedback.
          </p>

          <div className="mt-6 space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Your first name"
              maxLength={100}
              className="text-center"
              autoFocus
            />
            <Button
              onClick={handleSubmit}
              disabled={name.trim().length === 0}
              className="w-full bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
            >
              Continue
            </Button>
          </div>
        </div>

        <p className="text-xs text-[#7A7A7A]">
          Powered by Altared &middot; Wedding Planning Made Simple
        </p>
      </div>
    </div>
  );
}

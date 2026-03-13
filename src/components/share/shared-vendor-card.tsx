"use client";

import { Star, DollarSign, Globe, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VendorStatusBadge } from "@/components/vendors/vendor-status-badge";
import { PartnerReaction } from "./partner-reaction";

interface SharedVendor {
  id: string;
  name: string;
  company_name: string | null;
  website: string | null;
  instagram: string | null;
  status: string;
  rating: number | null;
  quoted_price: number | null;
  final_price: number | null;
  deposit_paid: boolean;
  is_booked: boolean;
  tags: string[] | null;
  vendor_categories?: { name: string; icon: string | null } | null;
}

interface ExistingReaction {
  reaction: string;
  comment: string | null;
}

interface SharedVendorCardProps {
  vendor: SharedVendor;
  token: string;
  partnerName: string;
  existingReaction?: ExistingReaction | null;
  onReacted: (vendorId: string, reaction: string, comment: string | null) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < rating
              ? "fill-[#C9A96E] text-[#C9A96E]"
              : "fill-transparent text-[#D1D5DB]"
          }`}
        />
      ))}
    </div>
  );
}

export function SharedVendorCard({
  vendor,
  token,
  partnerName,
  existingReaction,
  onReacted,
}: SharedVendorCardProps) {
  const displayPrice = vendor.final_price ?? vendor.quoted_price;
  const category = vendor.vendor_categories;

  return (
    <Card className="border-[#E8E4DF] transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-[#2D2D2D]">
                {vendor.name}
              </CardTitle>
              {vendor.is_booked && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#8B9F82]" />
              )}
            </div>
            {vendor.company_name && (
              <p className="mt-0.5 truncate text-xs text-[#7A7A7A]">
                {vendor.company_name}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Category + Status */}
        <div className="flex flex-wrap items-center gap-1.5">
          {category && (
            <Badge
              variant="secondary"
              className="border-transparent bg-[#8B9F82]/10 text-xs text-[#8B9F82]"
            >
              {category.name}
            </Badge>
          )}
          <VendorStatusBadge status={vendor.status as Parameters<typeof VendorStatusBadge>[0]["status"]} />
          {vendor.deposit_paid && (
            <Badge
              variant="secondary"
              className="border-transparent bg-green-50 text-xs text-green-700"
            >
              Deposit Paid
            </Badge>
          )}
        </div>

        {/* Price + Rating */}
        <div className="flex items-center justify-between">
          {displayPrice !== null ? (
            <div className="flex items-center gap-1 text-sm font-semibold text-[#2D2D2D]">
              <DollarSign className="size-3.5 text-[#8B9F82]" />
              {formatPrice(displayPrice)}
              {vendor.final_price && (
                <span className="ml-0.5 text-xs font-normal text-[#7A7A7A]">
                  final
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-[#7A7A7A]">No price yet</span>
          )}
          <StarRating rating={vendor.rating} />
        </div>

        {/* Tags */}
        {vendor.tags && vendor.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vendor.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-[#E5E7EB] text-xs text-[#7A7A7A]"
              >
                {tag}
              </Badge>
            ))}
            {vendor.tags.length > 3 && (
              <span className="text-xs text-[#7A7A7A]">
                +{vendor.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Website / Instagram */}
        <div className="flex items-center gap-3 text-xs text-[#7A7A7A]">
          {vendor.website && (
            <a
              href={
                vendor.website.startsWith("http")
                  ? vendor.website
                  : `https://${vendor.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 truncate hover:text-[#8B9F82]"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="size-3 shrink-0" />
              <span className="truncate">
                {vendor.website.replace(/^https?:\/\//, "")}
              </span>
            </a>
          )}
        </div>

        {/* Partner Reaction */}
        <div className="border-t border-[#E8E4DF] pt-3">
          <p className="mb-2 text-xs font-medium text-[#7A7A7A]">
            Your reaction
          </p>
          <PartnerReaction
            vendorId={vendor.id}
            token={token}
            partnerName={partnerName}
            existingReaction={existingReaction}
            onReacted={onReacted}
          />
        </div>
      </CardContent>
    </Card>
  );
}

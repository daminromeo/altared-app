'use client';

import { useRouter } from 'next/navigation';
import { Star, MapPin, Globe, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VendorStatusBadge } from './vendor-status-badge';
import { getVendorEmoji } from '@/lib/vendor-icons';

type VendorStatus =
  | 'researching'
  | 'contacted'
  | 'quoted'
  | 'meeting_scheduled'
  | 'negotiating'
  | 'booked'
  | 'declined'
  | 'archived';

type VendorSource = 'manual' | 'the_knot' | 'wedding_wire' | 'referral' | 'other';

interface Vendor {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  source: VendorSource | null;
  source_url: string | null;
  status: VendorStatus;
  rating: number | null;
  notes: string | null;
  quoted_price: number | null;
  final_price: number | null;
  deposit_amount: number | null;
  deposit_due_date: string | null;
  deposit_paid: boolean;
  is_booked: boolean;
  booked_date: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  vendor_categories?: { id: string; name: string; icon: string | null };
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null || rating === undefined) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < rating
              ? 'fill-[#C9A96E] text-[#C9A96E]'
              : 'fill-transparent text-[#D1D5DB]'
          }`}
        />
      ))}
    </div>
  );
}

interface VendorCardProps {
  vendor: Vendor;
  selected?: boolean;
  onSelect?: (id: string) => void;
  showCheckbox?: boolean;
}

export function VendorCard({
  vendor,
  selected = false,
  onSelect,
  showCheckbox = false,
}: VendorCardProps) {
  const router = useRouter();
  const displayPrice = vendor.final_price ?? vendor.quoted_price;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md relative"
      onClick={() => router.push(`/vendors/${vendor.id}`)}
    >
      {showCheckbox && (
        <div className="absolute top-3 right-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect?.(vendor.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="size-4 rounded border-[#D1D5DB] text-[#8B9F82] focus:ring-[#8B9F82] cursor-pointer"
            aria-label={`Select ${vendor.name} for comparison`}
          />
        </div>
      )}

      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2 pr-6">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-[#2D2D2D]">{vendor.name}</CardTitle>
            {vendor.company_name && (
              <p className="text-xs text-[#7A7A7A] truncate mt-0.5">
                {vendor.company_name}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {vendor.vendor_categories && (
            <Badge variant="secondary" className="bg-[#8B9F82]/10 text-[#8B9F82] border-transparent text-xs">
              {vendor.vendor_categories.icon && (
                <span className="mr-0.5">{getVendorEmoji(vendor.vendor_categories.icon)}</span>
              )}
              {vendor.vendor_categories.name}
            </Badge>
          )}
          <VendorStatusBadge status={vendor.status} />
        </div>

        <div className="flex items-center justify-between">
          {displayPrice !== null && displayPrice !== undefined ? (
            <div className="flex items-center gap-1 text-sm font-semibold text-[#2D2D2D]">
              <DollarSign className="size-3.5 text-[#8B9F82]" />
              {formatPrice(displayPrice)}
              {vendor.final_price && (
                <span className="text-xs font-normal text-[#7A7A7A] ml-0.5">final</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-[#7A7A7A]">No price yet</span>
          )}
          <StarRating rating={vendor.rating} />
        </div>

        {vendor.tags && vendor.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vendor.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs text-[#7A7A7A] border-[#E5E7EB]">
                {tag}
              </Badge>
            ))}
            {vendor.tags.length > 3 && (
              <span className="text-xs text-[#7A7A7A]">+{vendor.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-[#7A7A7A]">
          {vendor.website && (
            <span className="flex items-center gap-1 truncate">
              <Globe className="size-3 shrink-0" />
              <span className="truncate">{vendor.website.replace(/^https?:\/\//, '')}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { StarRating, formatPrice };

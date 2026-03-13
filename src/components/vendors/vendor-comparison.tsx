'use client';

import { useRouter } from 'next/navigation';
import { Star, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VendorStatusBadge } from './vendor-status-badge';
import { ScoreBar } from './comparison-score-bar';
import { ProsCons } from './comparison-pros-cons';
import { computeScores, getCellHighlight, generateProsCons } from '@/lib/vendor-scoring';
import type { ComparisonWeights, VendorScore, VendorProCon, CellHighlight } from '@/lib/types/comparison';
import { DEFAULT_WEIGHTS } from '@/lib/types/comparison';

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

const formatPrice = (price: number | null) => {
  if (price === null || price === undefined) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
};

const HIGHLIGHT_CLASSES: Record<Exclude<CellHighlight, null>, string> = {
  best: 'bg-[#047857]/8 text-[#047857] font-semibold',
  mid: '',
  worst: 'bg-[#DC2626]/5 text-[#DC2626]/80',
};

function getHighlightClass(highlight: CellHighlight): string {
  if (!highlight) return '';
  return HIGHLIGHT_CLASSES[highlight] ?? '';
}

interface VendorComparisonProps {
  vendors: Vendor[];
  onBook?: (vendorId: string) => void;
  weights?: ComparisonWeights;
  isPremiumUser?: boolean;
  onUpdateMetadata?: (vendorId: string, metadata: Record<string, unknown>) => void;
}

export function VendorComparison({
  vendors,
  onBook,
  weights = DEFAULT_WEIGHTS,
  isPremiumUser = false,
  onUpdateMetadata,
}: VendorComparisonProps) {
  const router = useRouter();

  // Compute scores
  const scores: VendorScore[] = isPremiumUser ? computeScores(vendors, weights) : [];
  const prosCons: VendorProCon[] = isPremiumUser ? generateProsCons(vendors, scores) : [];

  const bestScoreId = scores.length > 0
    ? scores.reduce((best, s) => (s.compositeScore > best.compositeScore ? s : best)).vendorId
    : null;

  // Prepare highlight data
  const prices = vendors.map((v) => v.final_price ?? v.quoted_price);
  const quotedPrices = vendors.map((v) => v.quoted_price);
  const ratings = vendors.map((v) => v.rating);

  // Row definitions
  const rows: {
    label: string;
    render: (vendor: Vendor, index: number) => React.ReactNode;
    getHighlight?: (index: number) => CellHighlight;
    premiumOnly?: boolean;
  }[] = [
    {
      label: 'Category',
      render: (v) =>
        v.vendor_categories ? (
          <span>
            {v.vendor_categories.icon && (
              <span className="mr-1">{v.vendor_categories.icon}</span>
            )}
            {v.vendor_categories.name}
          </span>
        ) : (
          <span className="text-[#7A7A7A]">--</span>
        ),
    },
    {
      label: 'Quoted Price',
      render: (v) => formatPrice(v.quoted_price),
      getHighlight: (i) =>
        isPremiumUser ? getCellHighlight(quotedPrices, i, false) : null,
    },
    {
      label: 'Final Price',
      render: (v) => formatPrice(v.final_price),
      getHighlight: (i) =>
        isPremiumUser ? getCellHighlight(prices, i, false) : null,
    },
    {
      label: 'Deposit',
      render: (v) => (
        <div>
          <div>{formatPrice(v.deposit_amount)}</div>
          {v.deposit_due_date && (
            <div className="text-xs text-[#7A7A7A]">
              Due: {new Date(v.deposit_due_date).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      label: 'Deposit Paid',
      render: (v) =>
        v.deposit_amount ? (
          v.deposit_paid ? (
            <CheckCircle2 className="size-4 text-[#047857] mx-auto" />
          ) : (
            <XCircle className="size-4 text-[#DC2626] mx-auto" />
          )
        ) : (
          <span className="text-[#7A7A7A]">--</span>
        ),
    },
    {
      label: 'Rating',
      render: (v) =>
        v.rating !== null && v.rating !== undefined ? (
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3.5 ${
                  i < v.rating!
                    ? 'fill-[#C9A96E] text-[#C9A96E]'
                    : 'fill-transparent text-[#D1D5DB]'
                }`}
              />
            ))}
            <span className="ml-1 text-sm">{v.rating}/5</span>
          </div>
        ) : (
          <span className="text-[#7A7A7A]">--</span>
        ),
      getHighlight: (i) =>
        isPremiumUser ? getCellHighlight(ratings, i, true) : null,
    },
    {
      label: 'Status',
      render: (v) => <VendorStatusBadge status={v.status} />,
    },
    {
      label: 'Responsiveness',
      premiumOnly: true,
      render: (v) => {
        const value = typeof v.metadata?.responsiveness === 'number' ? v.metadata.responsiveness : 0;
        return (
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const newVal = i + 1 === value ? 0 : i + 1;
                  onUpdateMetadata?.(v.id, { ...v.metadata, responsiveness: newVal });
                }}
                className="p-0 border-0 bg-transparent cursor-pointer"
              >
                <Star
                  className={`size-3.5 transition-colors ${
                    i < value
                      ? 'fill-[#8B9F82] text-[#8B9F82]'
                      : 'fill-transparent text-[#D1D5DB] hover:text-[#8B9F82]/50'
                  }`}
                />
              </button>
            ))}
            {value > 0 && <span className="ml-1 text-xs text-[#7A7A7A]">{value}/5</span>}
          </div>
        );
      },
    },
    {
      label: 'Gut Feeling',
      premiumOnly: true,
      render: (v) => {
        const value = typeof v.metadata?.gutFeeling === 'number' ? v.metadata.gutFeeling : 0;
        return (
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const newVal = i + 1 === value ? 0 : i + 1;
                  onUpdateMetadata?.(v.id, { ...v.metadata, gutFeeling: newVal });
                }}
                className="p-0 border-0 bg-transparent cursor-pointer"
              >
                <Star
                  className={`size-3.5 transition-colors ${
                    i < value
                      ? 'fill-[#C9A96E] text-[#C9A96E]'
                      : 'fill-transparent text-[#D1D5DB] hover:text-[#C9A96E]/50'
                  }`}
                />
              </button>
            ))}
            {value > 0 && <span className="ml-1 text-xs text-[#7A7A7A]">{value}/5</span>}
          </div>
        );
      },
    },
    {
      label: 'Notes',
      render: (v) =>
        v.notes ? (
          <p className="text-sm text-[#2D2D2D] line-clamp-3 max-w-[200px]">{v.notes}</p>
        ) : (
          <span className="text-[#7A7A7A]">--</span>
        ),
    },
    {
      label: 'Website',
      render: (v) =>
        v.website ? (
          <a
            href={v.website.startsWith("http") ? v.website : `https://${v.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#1D4ED8] underline underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            Visit
          </a>
        ) : (
          <span className="text-[#7A7A7A]">--</span>
        ),
    },
    {
      label: 'Tags',
      render: (v) =>
        v.tags && v.tags.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1">
            {v.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs text-[#4B5563]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[#7A7A7A]">--</span>
        ),
    },
  ];

  // Filter rows based on tier
  const visibleRows = rows.filter((row) => {
    if (row.premiumOnly && !isPremiumUser) return false;
    return true;
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[140px] bg-[#FAF8F5] sticky left-0 z-10">
              Feature
            </TableHead>
            {vendors.map((vendor) => (
              <TableHead key={vendor.id} className="min-w-[200px] text-center">
                <div className="space-y-1">
                  <div
                    className="font-semibold text-[#2D2D2D] cursor-pointer hover:underline"
                    onClick={() => router.push(`/vendors/${vendor.id}`)}
                  >
                    {vendor.name}
                  </div>
                  {vendor.company_name && (
                    <div className="text-xs font-normal text-[#7A7A7A]">
                      {vendor.company_name}
                    </div>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Score bar row (premium only) */}
          {isPremiumUser && scores.length > 0 && (
            <TableRow className="border-b-2 border-[#E8E4DF]">
              <TableCell className="font-medium text-[#2D2D2D] bg-[#FAF8F5] sticky left-0 z-10">
                Match Score
              </TableCell>
              {vendors.map((vendor) => {
                const score = scores.find((s) => s.vendorId === vendor.id);
                return (
                  <TableCell key={vendor.id} className="text-center">
                    <ScoreBar
                      score={score?.compositeScore ?? 0}
                      isTopPick={vendor.id === bestScoreId}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          )}

          {/* Data rows */}
          {visibleRows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="font-medium text-[#2D2D2D] bg-[#FAF8F5] sticky left-0 z-10">
                {row.label}
              </TableCell>
              {vendors.map((vendor, idx) => {
                const highlight = row.getHighlight?.(idx) ?? null;
                return (
                  <TableCell
                    key={vendor.id}
                    className={`text-center ${getHighlightClass(highlight)}`}
                  >
                    {row.render(vendor, idx)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}

          {/* Pros/Cons row (premium only) */}
          {isPremiumUser && prosCons.length > 0 && (
            <TableRow className="border-t-2 border-[#E8E4DF]">
              <TableCell className="font-medium text-[#2D2D2D] bg-[#FAF8F5] sticky left-0 z-10">
                Insights
              </TableCell>
              {vendors.map((vendor) => {
                const data = prosCons.find((p) => p.vendorId === vendor.id);
                return (
                  <TableCell key={vendor.id} className="text-center align-top">
                    {data ? (
                      <ProsCons data={data} />
                    ) : (
                      <span className="text-[#7A7A7A]">--</span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          )}

          {/* Book action row */}
          <TableRow>
            <TableCell className="font-medium text-[#2D2D2D] bg-[#FAF8F5] sticky left-0 z-10">
              Action
            </TableCell>
            {vendors.map((vendor) => (
              <TableCell key={vendor.id} className="text-center">
                <Button
                  onClick={() => onBook?.(vendor.id)}
                  disabled={vendor.is_booked}
                  className={
                    vendor.id === bestScoreId && isPremiumUser
                      ? 'bg-[#047857] hover:bg-[#065F46] text-white'
                      : 'bg-[#8B9F82] hover:bg-[#7A8E71] text-white'
                  }
                >
                  {vendor.is_booked
                    ? 'Booked'
                    : vendor.id === bestScoreId && isPremiumUser
                      ? 'Book Best Match'
                      : 'Book Vendor'}
                </Button>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  List,
  Plus,
  Upload,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Package,
  ChevronDown,
  Check,
  Link as LinkIcon,
  PenLine,
  Users,
  Share2,
  Copy,
  Loader2,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getVendorEmoji } from '@/lib/vendor-icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VendorCard } from '@/components/vendors/vendor-card';
import { VendorForm } from '@/components/vendors/vendor-form';
import { VendorImportModal } from '@/components/vendors/vendor-import-modal';
import { VendorStatusBadge } from '@/components/vendors/vendor-status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/auth-provider';
import { useSubscription, useCheckout } from '@/lib/hooks/use-subscription';
import { PLANS } from '@/lib/stripe/config';
import { toast } from 'sonner';

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

interface VendorCategory {
  id: string;
  name: string;
  icon: string | null;
  default_budget_percentage: number | null;
  sort_order: number;
}

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

type SortField = 'name' | 'quoted_price' | 'created_at' | 'rating';
type SortDirection = 'asc' | 'desc';

const formatPrice = (price: number | null) => {
  if (price === null || price === undefined) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
};

const ALL_STATUSES: VendorStatus[] = [
  'researching',
  'contacted',
  'quoted',
  'meeting_scheduled',
  'negotiating',
  'booked',
  'declined',
  'archived',
];

const STATUS_DISPLAY: Record<VendorStatus, { label: string; color: string; bg: string; activeBg: string }> = {
  researching: { label: 'Researching', color: 'text-[#6B7280]', bg: 'bg-[#F3F4F6]', activeBg: 'bg-[#6B7280] text-white' },
  contacted: { label: 'Contacted', color: 'text-[#2563EB]', bg: 'bg-[#DBEAFE]', activeBg: 'bg-[#2563EB] text-white' },
  quoted: { label: 'Quoted', color: 'text-[#7C3AED]', bg: 'bg-[#EDE9FE]', activeBg: 'bg-[#7C3AED] text-white' },
  meeting_scheduled: { label: 'Meeting', color: 'text-brass', bg: 'bg-champagne/10', activeBg: 'bg-champagne text-white' },
  negotiating: { label: 'Negotiating', color: 'text-[#EA580C]', bg: 'bg-[#FFF7ED]', activeBg: 'bg-[#EA580C] text-white' },
  booked: { label: 'Booked', color: 'text-[#047857]', bg: 'bg-[#D1FAE5]', activeBg: 'bg-[#047857] text-white' },
  declined: { label: 'Declined', color: 'text-error', bg: 'bg-[#FEE2E2]', activeBg: 'bg-error text-white' },
  archived: { label: 'Archived', color: 'text-[#6B7280]', bg: 'bg-[#F3F4F6]', activeBg: 'bg-[#6B7280] text-white' },
};

function CategoryFilterDropdown({
  categories,
  selected,
  onToggle,
  onClear,
}: {
  categories: VendorCategory[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const selectedNames = categories
    .filter((c) => selected.has(c.id))
    .map((c) => c.name);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            selected.size > 0
              ? 'border-moss bg-moss/5 text-ink'
              : 'border-input bg-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <span className="max-w-[200px] truncate sm:max-w-none">
            {selected.size === 0
              ? 'All Categories'
              : selected.size === 1
                ? selectedNames[0]
                : `${selected.size} categories`}
          </span>
          <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 z-50 mt-1 w-64 rounded-lg border bg-white py-1 shadow-lg">
            <div className="max-h-64 overflow-y-auto">
              {categories.map((cat) => {
                const isActive = selected.has(cat.id);
                const emoji = getVendorEmoji(cat.icon);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onToggle(cat.id)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink hover:bg-paper transition-colors"
                  >
                    <div
                      className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        isActive
                          ? 'border-moss bg-moss'
                          : 'border-[#D1D5DB]'
                      }`}
                    >
                      {isActive && <Check className="size-3 text-white" />}
                    </div>
                    {emoji && <span className="text-base leading-none">{emoji}</span>}
                    <span className="flex-1 text-left">{cat.name}</span>
                  </button>
                );
              })}
            </div>
            {selected.size > 0 && (
              <>
                <div className="mx-2 my-1 border-t border-[#E5E7EB]" />
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  <X className="size-3" />
                  Clear selection
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Selected category badges */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {categories
            .filter((c) => selected.has(c.id))
            .map((cat) => (
              <Badge
                key={cat.id}
                variant="secondary"
                className="gap-1 bg-moss/10 text-moss text-xs cursor-pointer hover:bg-moss/20 transition-colors"
                onClick={() => onToggle(cat.id)}
              >
                {getVendorEmoji(cat.icon)} {cat.name}
                <X className="size-3" />
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
}

function VendorLimitModal({
  open,
  onOpenChange,
  vendorLimit,
  currentCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  vendorLimit: number;
  currentCount: number;
}) {
  const checkout = useCheckout();
  const pass = PLANS.pass;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-sage-soft">
            <Package className="size-6 text-moss" />
          </div>
          <DialogTitle className="text-center">You&apos;ve reached {vendorLimit} vendors</DialogTitle>
          <DialogDescription className="text-center">
            The Free plan holds up to {vendorLimit} vendors, and you have {currentCount}. The
            Wedding Pass removes the limit.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={() => checkout.mutate({ location: 'vendor_limit' })}
          disabled={checkout.isPending}
          className="mt-1 flex w-full items-center gap-4 rounded-2xl border border-moss bg-sage-soft/60 p-4 text-left transition-colors hover:bg-sage-soft"
        >
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-ink">{pass.name}</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Unlimited vendors, compare 4 side by side, AI scanning, partner sharing
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-lg font-bold text-ink">${pass.price}</p>
            <p className="text-[10px] text-ink-muted">one time</p>
          </div>
        </button>
        {checkout.isError && (
          <p role="alert" className="text-center text-xs text-error">
            Checkout didn&apos;t open: {checkout.error.message}. Try again in a moment.
          </p>
        )}

        <DialogFooter className="mt-2 sm:justify-center">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-sm text-ink-muted">
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function VendorsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { getComparisonVendorLimit, isFreePlan, canUseFeature, plan } = useSubscription();
  const vendorCheckout = useCheckout();

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const vendorLimit = plan.limits.vendors;

  function checkVendorLimit(): boolean {
    // 999999 is the serialized sentinel for "unlimited" (Infinity isn't JSON-safe)
    if (vendorLimit < 999999 && vendors.length >= vendorLimit) {
      setLimitModalOpen(true);
      return false;
    }
    return true;
  }

  // Partner sharing CTA
  const [sharingCtaDismissed, setSharingCtaDismissed] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('altared_sharing_cta_dismissed') === '1';
  });

  function dismissSharingCta() {
    localStorage.setItem('altared_sharing_cta_dismissed', '1');
    setSharingCtaDismissed(true);
  }

  // Share link popup
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  async function fetchOrCreateShareLink() {
    setShareLoading(true);
    try {
      // Check for existing active link first
      const getRes = await fetch('/api/share');
      if (getRes.ok) {
        const data = await getRes.json();
        const active = (data.links ?? []).find((l: { is_active: boolean }) => l.is_active);
        if (active) {
          setShareLink(active.shareUrl);
          setShareLoading(false);
          return;
        }
      }
      // No active link — create one
      const postRes = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (postRes.ok) {
        const data = await postRes.json();
        setShareLink(data.shareUrl);
      } else {
        toast.error('Failed to generate share link');
      }
    } catch {
      toast.error('Failed to generate share link');
    } finally {
      setShareLoading(false);
    }
  }

  function handleOpenShareDialog() {
    setShareDialogOpen(true);
    setShareCopied(false);
    fetchOrCreateShareLink();
  }

  function handleCopyShareLink() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setShareCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setShareCopied(false), 2000);
  }

  // Comparison selection
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());

  const fetchVendors = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      let query = supabase
        .from('vendors')
        .select('*, vendor_categories(*)');

      if (filterCategories.size > 0) {
        query = query.in('category_id', Array.from(filterCategories));
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (priceMin) {
        query = query.gte('quoted_price', parseFloat(priceMin));
      }
      if (priceMax) {
        query = query.lte('quoted_price', parseFloat(priceMax));
      }

      const ascending = sortDirection === 'asc';
      query = query.order(sortField, { ascending, nullsFirst: false });

      const { data, error } = await query;

      if (error) throw error;
      setVendors((data as Vendor[]) ?? []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [authUser, filterCategories, filterStatus, priceMin, priceMax, sortField, sortDirection]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('vendor_categories')
      .select('*')
      .order('sort_order');
    if (data) setCategories(data as VendorCategory[]);
  }, []);

  useEffect(() => {
    fetchVendors();
    fetchCategories();
  }, [fetchVendors, fetchCategories]);

  // Client-side search filter
  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors;
    const q = searchQuery.toLowerCase();
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.company_name?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [vendors, searchQuery]);

  function toggleCompare(id: string) {
    const limit = getComparisonVendorLimit();
    setSelectedForCompare((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= limit) {
          if (isFreePlan) {
            toast.error('The Free plan compares 2 vendors at a time. The Wedding Pass compares up to 4.');
          } else {
            toast.error(`You can compare up to ${limit} vendors at a time`);
          }
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  function goToCompare() {
    if (selectedForCompare.size < 2) {
      toast.error('Please select at least 2 vendors to compare');
      return;
    }
    const ids = Array.from(selectedForCompare).join(',');
    router.push(`/vendors/compare?ids=${ids}`);
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function toggleCategoryFilter(categoryId: string) {
    setFilterCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function clearFilters() {
    setFilterCategories(new Set());
    setFilterStatus('all');
    setPriceMin('');
    setPriceMax('');
    setSearchQuery('');
  }

  const hasActiveFilters =
    filterCategories.size > 0 ||
    filterStatus !== 'all' ||
    priceMin !== '' ||
    priceMax !== '';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Vendors</h1>
          <p className="text-sm text-ink-muted mt-1">
            Manage and compare your wedding vendors
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center gap-1.5 rounded-lg bg-moss px-3 h-8 text-sm font-medium text-white transition-colors hover:bg-moss-light outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-4" />
            Add Vendor
            <ChevronDown className="size-3.5 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem onClick={() => checkVendorLimit() && setFormOpen(true)} className="cursor-pointer">
              <PenLine className="size-4" />
              Manual Entry
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => checkVendorLimit() && setImportOpen(true)} className="cursor-pointer">
              <LinkIcon className="size-4" />
              Import from URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search and view toggle */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters((f) => !f)}
          className={`shrink-0 ${showFilters ? 'border-moss text-moss' : ''}`}
        >
          <SlidersHorizontal className="size-4" />
        </Button>

        <div className="flex shrink-0 items-center border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-moss text-white'
                : 'text-ink-muted hover:text-ink'
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-moss text-white'
                : 'text-ink-muted hover:text-ink'
            }`}
            aria-label="List view"
          >
            <List className="size-4" />
          </button>
        </div>

        {/* Sort */}
        <Select
          value={`${sortField}-${sortDirection}`}
          onValueChange={(val) => {
            if (!val) return;
            const [field, dir] = val.split('-') as [SortField, SortDirection];
            setSortField(field);
            setSortDirection(dir);
          }}
        >
          <SelectTrigger className="w-auto shrink-0 sm:w-[180px]">
            <ArrowUpDown className="size-3.5 sm:mr-1" />
            <SelectValue placeholder="Sort by" className="hidden sm:inline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="quoted_price-asc">Price: Low to High</SelectItem>
            <SelectItem value="quoted_price-desc">Price: High to Low</SelectItem>
            <SelectItem value="created_at-desc">Newest First</SelectItem>
            <SelectItem value="created_at-asc">Oldest First</SelectItem>
            <SelectItem value="rating-desc">Highest Rated</SelectItem>
            <SelectItem value="rating-asc">Lowest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-ink text-white'
              : 'bg-[#F3F4F6] text-ink-muted hover:bg-[#E5E7EB] hover:text-ink'
          }`}
        >
          All
        </button>
        {ALL_STATUSES.map((status) => {
          const display = STATUS_DISPLAY[status];
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(isActive ? 'all' : status)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? display.activeBg
                  : `${display.bg} ${display.color} hover:opacity-80`
              }`}
            >
              {display.label}
            </button>
          );
        })}
      </div>

      {/* Category multi-select dropdown */}
      {categories.length > 0 && (
        <CategoryFilterDropdown
          categories={categories}
          selected={filterCategories}
          onToggle={toggleCategoryFilter}
          onClear={() => setFilterCategories(new Set())}
        />
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-muted">Status</label>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ALL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-muted">Min Price</label>
            <Input
              type="number"
              placeholder="$0"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-[120px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-muted">Max Price</label>
            <Input
              type="number"
              placeholder="$∞"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-[120px]"
            />
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-ink-muted">
              <X className="size-3.5" />
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Comparison bar */}
      {selectedForCompare.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-moss bg-moss/5 p-3">
          <div className="flex items-center gap-2 text-sm text-ink">
            <span className="font-medium">{selectedForCompare.size} vendor(s) selected</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setSelectedForCompare(new Set())}
              className="text-ink-muted"
            >
              Clear
            </Button>
          </div>
          <Button
            onClick={goToCompare}
            disabled={selectedForCompare.size < 2}
            className="bg-moss hover:bg-moss-light text-white"
            size="sm"
          >
            Compare Selected
          </Button>
        </div>
      )}

      {/* Sharing CTA */}
      {!sharingCtaDismissed && vendors.length >= 2 && (
        <div className="relative flex flex-col gap-3 rounded-xl border border-[#C4A0A0]/30 bg-gradient-to-r from-[#C4A0A0]/5 to-moss/5 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#C4A0A0]/10">
            <Users className="size-5 text-[#C4A0A0]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              Get a second opinion
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {canUseFeature('partner_sharing')
                ? 'Share a magic link so your partner, family, or wedding planner can browse vendors, view budgets, and leave reactions — no account needed.'
                : 'Get the Wedding Pass to share a live view with your partner, family, or wedding planner and get their reactions on every vendor.'}
            </p>
          </div>
          {canUseFeature('partner_sharing') ? (
            <button
              type="button"
              onClick={handleOpenShareDialog}
              className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#C4A0A0] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#B08F8F] sm:w-auto"
            >
              <Share2 className="size-3.5" />
              Share Link
            </button>
          ) : (
            <button
              type="button"
              disabled={vendorCheckout.isPending}
              onClick={() => {
                vendorCheckout.mutate({ location: 'vendors_sharing_cta' });
              }}
              className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-champagne px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#B8985D] sm:w-auto"
            >
              {vendorCheckout.isPending ? 'Opening…' : `Get the pass · $${PLANS.pass.price}`}
            </button>
          )}
          <button
            type="button"
            onClick={dismissSharingCta}
            className="absolute right-2 top-2 rounded-md p-0.5 text-ink-muted transition-colors hover:text-ink"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Share link dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Share Your Wedding Plans</DialogTitle>
            <DialogDescription>
              Anyone with this link can view your vendors, budget, and leave reactions — no account needed.
            </DialogDescription>
          </DialogHeader>
          {shareLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-moss" />
            </div>
          ) : shareLink ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-hairline bg-[#FAFAF8] p-2.5">
                <Link2 className="size-4 shrink-0 text-moss" />
                <input
                  readOnly
                  value={shareLink}
                  className="min-w-0 flex-1 bg-transparent text-xs text-ink-muted outline-none"
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <Button
                onClick={handleCopyShareLink}
                className="w-full bg-moss text-white hover:bg-moss-light"
              >
                {shareCopied ? (
                  <>
                    <Check className="mr-2 size-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 size-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          ) : (
            <p className="text-center text-sm text-ink-muted">
              Something went wrong. Please try again.
            </p>
          )}
          <p className="text-center text-xs text-ink-muted">
            Manage this link in{' '}
            <Link href="/settings?tab=sharing" className="underline hover:text-ink">
              Settings
            </Link>
          </p>
        </DialogContent>
      </Dialog>

      {/* Loading */}
      {(authLoading || loading) ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-moss/30 border-t-moss" />
            <p className="text-sm text-ink-muted">Loading vendors...</p>
          </div>
        </div>
      ) : filteredVendors.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-moss/10 p-4 mb-4">
            <Package className="size-8 text-moss" />
          </div>
          <h3 className="text-lg font-medium text-ink mb-1">No vendors found</h3>
          <p className="text-sm text-ink-muted mb-4 max-w-sm">
            {hasActiveFilters || searchQuery
              ? 'Try adjusting your filters or search query.'
              : 'Get started by adding your first vendor or importing from a listing site.'}
          </p>
          <div className="flex gap-2">
            {hasActiveFilters || searchQuery ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center gap-1.5 rounded-lg bg-moss px-3 h-8 text-sm font-medium text-white transition-colors hover:bg-moss-light outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="size-4" />
                Add Vendor
                <ChevronDown className="size-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuItem onClick={() => setFormOpen(true)} className="cursor-pointer">
                  <PenLine className="size-4" />
                  Manual Entry
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setImportOpen(true)} className="cursor-pointer">
                  <LinkIcon className="size-4" />
                  Import from URL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid view */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredVendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              showCheckbox
              selected={selectedForCompare.has(vendor.id)}
              onSelect={toggleCompare}
            />
          ))}
        </div>
      ) : (
        /* List / table view */
        <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <span className="sr-only">Select</span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort('name')}
                >
                  <span className="flex items-center gap-1">
                    Name
                    {sortField === 'name' && (
                      <ArrowUpDown className="size-3" />
                    )}
                  </span>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort('quoted_price')}
                >
                  <span className="flex items-center gap-1">
                    Price
                    {sortField === 'quoted_price' && (
                      <ArrowUpDown className="size-3" />
                    )}
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort('rating')}
                >
                  <span className="flex items-center gap-1">
                    Rating
                    {sortField === 'rating' && (
                      <ArrowUpDown className="size-3" />
                    )}
                  </span>
                </TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow
                  key={vendor.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/vendors/${vendor.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedForCompare.has(vendor.id)}
                      onChange={() => toggleCompare(vendor.id)}
                      className="size-4 rounded border-[#D1D5DB] text-moss focus:ring-moss"
                      aria-label={`Select ${vendor.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-ink">{vendor.name}</p>
                      {vendor.company_name && (
                        <p className="text-xs text-ink-muted">{vendor.company_name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {vendor.vendor_categories ? (
                      <Badge
                        variant="secondary"
                        className="bg-moss/10 text-moss border-transparent text-xs"
                      >
                        {vendor.vendor_categories.icon && (
                          <span className="mr-0.5">{getVendorEmoji(vendor.vendor_categories.icon)}</span>
                        )}
                        {vendor.vendor_categories.name}
                      </Badge>
                    ) : (
                      <span className="text-ink-muted">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <VendorStatusBadge status={vendor.status} />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(vendor.final_price ?? vendor.quoted_price)}
                  </TableCell>
                  <TableCell>
                    {vendor.rating !== null && vendor.rating !== undefined ? (
                      <span className="text-sm">
                        {'★'.repeat(vendor.rating)}
                        {'☆'.repeat(5 - vendor.rating)}
                      </span>
                    ) : (
                      <span className="text-ink-muted">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-ink-muted">
                    {new Date(vendor.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modals */}
      <VendorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchVendors}
      />

      <VendorImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onManualEntry={() => setFormOpen(true)}
      />

      {/* Vendor limit upgrade modal */}
      <VendorLimitModal
        open={limitModalOpen}
        onOpenChange={setLimitModalOpen}
        planName={plan.name}
        vendorLimit={vendorLimit}
        currentCount={vendors.length}
      />
    </div>
  );
}

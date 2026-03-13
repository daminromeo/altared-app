'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VendorComparison } from '@/components/vendors/vendor-comparison';
import { VendorStatusBadge } from '@/components/vendors/vendor-status-badge';
import { ComparisonWeightSliders } from '@/components/vendors/comparison-weight-sliders';
import { AIRecommendationPanel } from '@/components/vendors/comparison-ai-recommendation';
import { UpgradePrompt } from '@/components/upgrade-prompt';
import { createClient } from '@/lib/supabase/client';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { DEFAULT_WEIGHTS } from '@/lib/types/comparison';
import type { ComparisonWeights } from '@/lib/types/comparison';
import type { Json } from '@/lib/types/database';
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

export default function VendorComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { canUseFeature, getComparisonVendorLimit, isFreePlan } = useSubscription();

  const idsParam = searchParams.get('ids');
  const initialIds = idsParam ? idsParam.split(',').filter(Boolean) : [];

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelector, setShowSelector] = useState(initialIds.length === 0);
  const [weights, setWeights] = useState<ComparisonWeights>(() => {
    if (typeof window === 'undefined') return { ...DEFAULT_WEIGHTS };
    try {
      const saved = localStorage.getItem('altared_comparison_weights');
      if (saved) return JSON.parse(saved) as ComparisonWeights;
    } catch { /* ignore */ }
    return { ...DEFAULT_WEIGHTS };
  });

  const handleWeightsChange = useCallback((w: ComparisonWeights) => {
    setWeights(w);
    try {
      localStorage.setItem('altared_comparison_weights', JSON.stringify(w));
    } catch { /* ignore */ }
  }, []);

  const isPremiumUser = canUseFeature('comparison_scoring');
  const vendorLimit = getComparisonVendorLimit();

  const fetchCompareVendors = useCallback(async () => {
    if (selectedIds.length === 0) {
      setVendors([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*, vendor_categories(*)')
        .in('id', selectedIds);

      if (error) throw error;
      setVendors((data as Vendor[]) ?? []);
    } catch (err) {
      console.error('Error fetching vendors for comparison:', err);
      toast.error('Failed to load vendors for comparison');
    } finally {
      setLoading(false);
    }
  }, [selectedIds, supabase]);

  const fetchAllVendors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*, vendor_categories(*)')
        .order('name');

      if (error) throw error;
      setAllVendors((data as Vendor[]) ?? []);
    } catch (err) {
      console.error('Error fetching all vendors:', err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCompareVendors();
    fetchAllVendors();
  }, [fetchCompareVendors, fetchAllVendors]);

  // Update URL when selections change
  useEffect(() => {
    if (selectedIds.length > 0) {
      const newUrl = `/vendors/compare?ids=${selectedIds.join(',')}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [selectedIds]);

  function addVendor(vendorId: string) {
    if (selectedIds.includes(vendorId)) {
      toast.error('Vendor is already in comparison');
      return;
    }
    if (selectedIds.length >= vendorLimit) {
      if (isFreePlan) {
        toast.error('Free plan supports comparing up to 2 vendors. Upgrade to Pro for up to 4.');
      } else {
        toast.error(`You can compare up to ${vendorLimit} vendors at a time`);
      }
      return;
    }
    setSelectedIds((prev) => [...prev, vendorId]);
    setShowSelector(false);
  }

  function removeVendor(vendorId: string) {
    setSelectedIds((prev) => prev.filter((id) => id !== vendorId));
  }

  async function handleBook(vendorId: string) {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .update({
          status: 'booked',
          is_booked: true,
          booked_date: new Date().toISOString(),
        })
        .eq('id', vendorId)
        .select('*, vendor_categories(*)')
        .single();

      if (error) throw error;

      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? (data as Vendor) : v))
      );
      toast.success(`${(data as Vendor).name} has been booked!`);
    } catch (err) {
      console.error('Error booking vendor:', err);
      toast.error('Failed to book vendor');
    }
  }

  async function handleUpdateMetadata(vendorId: string, metadata: Record<string, unknown>) {
    // Optimistic update
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, metadata } : v))
    );

    try {
      const { error } = await supabase
        .from('vendors')
        .update({ metadata: metadata as { [key: string]: Json | undefined } })
        .eq('id', vendorId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating vendor metadata:', err);
      toast.error('Failed to save rating');
      fetchCompareVendors();
    }
  }

  const filteredAllVendors = allVendors.filter((v) => {
    if (selectedIds.includes(v.id)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.company_name?.toLowerCase().includes(q) ||
      v.vendor_categories?.name.toLowerCase().includes(q)
    );
  });

  const vendorNames = useMemo(
    () => Object.fromEntries(vendors.map((v) => [v.id, v.name])),
    [vendors]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/vendors')}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-[#2D2D2D]">Compare Vendors</h1>
            <p className="text-sm text-[#7A7A7A] mt-0.5">
              {isPremiumUser
                ? 'Smart comparison with weighted scoring and AI insights'
                : 'Side-by-side comparison of your selected vendors'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowSelector(true)}
          disabled={selectedIds.length >= vendorLimit}
        >
          <Plus className="size-4" />
          Add Vendor
          {isFreePlan && selectedIds.length >= 2 && (
            <Badge className="ml-1.5 bg-[#C9A96E]/10 text-[#C9A96E] text-[10px]">Pro</Badge>
          )}
        </Button>
      </div>

      {/* Selected vendor chips */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-[#7A7A7A]">
            Comparing: {selectedIds.length} of {vendorLimit}
          </span>
          {vendors.map((vendor) => (
            <Badge
              key={vendor.id}
              variant="secondary"
              className="gap-1.5 bg-[#8B9F82]/10 text-[#8B9F82] pr-1"
            >
              {vendor.name}
              <button
                onClick={() => removeVendor(vendor.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-[#8B9F82]/20"
                aria-label={`Remove ${vendor.name} from comparison`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Vendor selector */}
      {showSelector && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#2D2D2D]">
              Select Vendors to Compare
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#7A7A7A]" />
              <Input
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredAllVendors.length === 0 ? (
                <p className="text-sm text-[#7A7A7A] text-center py-4">
                  No vendors found
                </p>
              ) : (
                filteredAllVendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    onClick={() => addVendor(vendor.id)}
                    className="flex w-full items-center justify-between rounded-lg p-2.5 text-left transition-colors hover:bg-[#FAF8F5]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#2D2D2D]">
                        {vendor.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {vendor.company_name && (
                          <span className="text-xs text-[#7A7A7A]">
                            {vendor.company_name}
                          </span>
                        )}
                        {vendor.vendor_categories && (
                          <Badge
                            variant="outline"
                            className="text-xs border-[#E5E7EB] text-[#7A7A7A]"
                          >
                            {vendor.vendor_categories.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <VendorStatusBadge status={vendor.status} />
                      <span className="text-sm text-[#2D2D2D]">
                        {formatPrice(vendor.final_price ?? vendor.quoted_price)}
                      </span>
                      <Plus className="size-4 text-[#8B9F82]" />
                    </div>
                  </button>
                ))
              )}
            </div>
            {selectedIds.length > 0 && (
              <div className="flex justify-end pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSelector(false)}
                >
                  Done
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comparison content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-[#8B9F82]" />
            <p className="text-sm text-[#7A7A7A]">Loading comparison...</p>
          </div>
        </div>
      ) : vendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-[#8B9F82]/10 p-4 mb-4">
            <BarChart3 className="size-8 text-[#8B9F82]" />
          </div>
          <h3 className="text-lg font-medium text-[#2D2D2D] mb-1">
            No vendors selected
          </h3>
          <p className="text-sm text-[#7A7A7A] mb-4 max-w-sm">
            Select at least 2 vendors to compare them side by side.
          </p>
          <Button
            onClick={() => setShowSelector(true)}
            className="bg-[#8B9F82] hover:bg-[#7A8E71] text-white"
          >
            <Plus className="size-4" />
            Select Vendors
          </Button>
        </div>
      ) : vendors.length === 1 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-[#7A7A7A] mb-3">
            Select at least one more vendor to start comparing.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowSelector(true)}
          >
            <Plus className="size-4" />
            Add Another Vendor
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Weight sliders (premium only) */}
          {isPremiumUser ? (
            <ComparisonWeightSliders weights={weights} onChange={handleWeightsChange} />
          ) : (
            <UpgradePrompt
              title="Smart Scoring"
              description="Set your priorities and get weighted scores, color-coded insights, and AI recommendations."
              compact
            />
          )}

          {/* AI Recommendation */}
          {vendors.length >= 2 && (
            <AIRecommendationPanel
              vendorIds={vendors.map((v) => v.id)}
              weights={weights}
              isPremiumUser={isPremiumUser}
              vendorNames={vendorNames}
            />
          )}

          {/* Comparison table */}
          <Card>
            <CardContent className="p-0">
              <VendorComparison
                vendors={vendors}
                onBook={handleBook}
                weights={weights}
                isPremiumUser={isPremiumUser}
                onUpdateMetadata={handleUpdateMetadata}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

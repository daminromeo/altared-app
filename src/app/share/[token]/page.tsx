"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PartnerNameGate } from "@/components/share/partner-name-gate";
import { SharedVendorCard } from "@/components/share/shared-vendor-card";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SharedProfile {
  full_name: string | null;
  partner_name: string | null;
  wedding_name: string | null;
  wedding_date: string | null;
  wedding_location: string | null;
  total_budget: number | null;
}

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
  deposit_amount: number | null;
  deposit_due_date: string | null;
  deposit_paid: boolean;
  is_booked: boolean;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  category_id: string | null;
  vendor_categories?: { name: string; icon: string | null } | null;
}

interface SharedBudgetItem {
  id: string;
  description: string;
  estimated_cost: number;
  actual_cost: number;
  is_paid: boolean;
  deposit_paid?: boolean;
  category_id: string | null;
  vendor_id: string | null;
  vendor_categories?: { name: string } | null;
}

interface Reaction {
  id: string;
  vendor_id: string;
  reaction: string;
  comment: string | null;
  partner_name: string;
}

interface SharedData {
  profile: SharedProfile | null;
  vendors: SharedVendor[];
  budgetItems: SharedBudgetItem[];
  reactions: Reaction[];
  partnerName: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PARTNER_NAME_KEY = "altared_partner_name";

function getStoredName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PARTNER_NAME_KEY);
}

function storeName(name: string) {
  localStorage.setItem(PARTNER_NAME_KEY, name);
  document.cookie = `${PARTNER_NAME_KEY}=${encodeURIComponent(name)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function SharedViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameChecked, setNameChecked] = useState(false);

  // Check for stored name
  useEffect(() => {
    const stored = getStoredName();
    if (stored) setPartnerName(stored);
    setNameChecked(true);
  }, []);

  // Fetch shared data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/share/${token}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.error === "invalid_or_expired") {
          setError("expired");
        } else {
          setError("error");
        }
        return;
      }
      const json = await res.json();
      setData(json);

      // If server has a partner name but we don't locally, use it
      if (json.partnerName && !getStoredName()) {
        setPartnerName(json.partnerName);
        storeName(json.partnerName);
      }
    } catch {
      setError("error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (nameChecked) fetchData();
  }, [nameChecked, fetchData]);

  // Handle name submission
  async function handleNameSubmit(name: string) {
    storeName(name);
    setPartnerName(name);

    // Persist to server
    fetch(`/api/share/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerName: name }),
    }).catch(() => {});
  }

  // Handle reaction update (optimistic)
  function handleReacted(
    vendorId: string,
    reaction: string,
    comment: string | null
  ) {
    setData((prev) => {
      if (!prev) return prev;
      const existing = prev.reactions.findIndex(
        (r) => r.vendor_id === vendorId
      );
      const newReaction: Reaction = {
        id: existing >= 0 ? prev.reactions[existing].id : "temp",
        vendor_id: vendorId,
        reaction,
        comment,
        partner_name: partnerName ?? "",
      };

      const reactions =
        existing >= 0
          ? prev.reactions.map((r, i) => (i === existing ? newReaction : r))
          : [...prev.reactions, newReaction];

      return { ...prev, reactions };
    });
  }

  // ── Error states ───────────────────────────────────────────────────────────

  if (error === "expired") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="max-w-md space-y-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-[#C9A96E]" />
          <h1
            className="text-2xl font-bold text-[#2D2D2D]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Link Expired
          </h1>
          <p className="text-[#7A7A7A]">
            This shared link is no longer active. Ask them to generate a
            new one from their Altared dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (error === "error") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="max-w-md space-y-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="text-2xl font-bold text-[#2D2D2D]">
            Something went wrong
          </h1>
          <p className="text-[#7A7A7A]">
            We couldn&apos;t load the shared data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (loading || !nameChecked) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B9F82]" />
      </div>
    );
  }

  // ── Name gate ──────────────────────────────────────────────────────────────

  if (!partnerName) {
    return (
      <PartnerNameGate
        weddingName={data?.profile?.wedding_name}
        sharedBy={data?.profile?.full_name}
        onSubmit={handleNameSubmit}
      />
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B9F82]" />
      </div>
    );
  }

  // ── Compute budget stats (matching budget page logic) ──────────────────────

  const totalBudget = data.profile?.total_budget ?? 0;
  // Committed = sum of estimated_cost (same as budget page)
  const committed = data.budgetItems.reduce(
    (s, i) => s + i.estimated_cost,
    0
  );
  // Paid = sum of actual_cost where actual_cost > 0 (same as budget page)
  const totalPaid = data.budgetItems.reduce(
    (s, i) => (i.actual_cost && i.actual_cost > 0 ? s + i.actual_cost : s),
    0
  );

  const bookedVendors = data.vendors.filter((v) => v.is_booked).length;
  const reactionsMap = new Map(
    data.reactions.map((r) => [r.vendor_id, r])
  );

  // Group vendors by category for the vendors tab
  const vendorsByCategory = data.vendors.reduce<
    Map<string, { name: string; vendors: SharedVendor[] }>
  >((acc, vendor) => {
    const catName =
      vendor.vendor_categories?.name ?? "Uncategorized";
    const key = vendor.category_id ?? "uncategorized";
    if (!acc.has(key)) {
      acc.set(key, { name: catName, vendors: [] });
    }
    acc.get(key)!.vendors.push(vendor);
    return acc;
  }, new Map());

  // Sort categories alphabetically, but put Uncategorized last
  const sortedCategories = Array.from(vendorsByCategory.entries()).sort(
    ([keyA, a], [keyB, b]) => {
      if (keyA === "uncategorized") return 1;
      if (keyB === "uncategorized") return -1;
      return a.name.localeCompare(b.name);
    }
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* Wedding Header */}
      <div className="mb-8 space-y-2">
        <p className="text-sm text-[#7A7A7A]">
          Hi {partnerName}! Here&apos;s what&apos;s been planned so far.
        </p>
        <h1
          className="text-3xl font-bold text-[#2D2D2D]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {data.profile?.wedding_name ?? "Our Wedding"}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-[#7A7A7A]">
          {data.profile?.wedding_date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#8B9F82]" />
              {formatDate(data.profile.wedding_date)}
            </span>
          )}
          {data.profile?.wedding_location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#8B9F82]" />
              {data.profile.wedding_location}
            </span>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-[#E8E4DF]">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#7A7A7A]">Vendors</p>
            <p className="mt-1 text-2xl font-bold text-[#2D2D2D]">
              {data.vendors.length}
            </p>
            <p className="text-xs text-[#8B9F82]">
              {bookedVendors} booked
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#E8E4DF]">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#7A7A7A]">Budget</p>
            <p className="mt-1 text-2xl font-bold text-[#2D2D2D]">
              {totalBudget > 0 ? formatPrice(totalBudget) : "—"}
            </p>
            <p className="text-xs text-[#7A7A7A]">total budget</p>
          </CardContent>
        </Card>
        <Card className="border-[#E8E4DF]">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#7A7A7A]">Estimated Total</p>
            <p className="mt-1 text-2xl font-bold text-[#2D2D2D]">
              {formatPrice(committed)}
            </p>
            <p className="text-xs text-[#7A7A7A]">estimated</p>
          </CardContent>
        </Card>
        <Card className="border-[#E8E4DF]">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[#7A7A7A]">Paid</p>
            <p className="mt-1 text-2xl font-bold text-[#8B9F82]">
              {formatPrice(totalPaid)}
            </p>
            <p className="text-xs text-[#7A7A7A]">so far</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vendors">
        <TabsList className="w-full justify-start gap-1 bg-white">
          <TabsTrigger value="vendors">
            <Users className="mr-1.5 h-4 w-4" />
            Vendors ({data.vendors.length})
          </TabsTrigger>
          <TabsTrigger value="budget">
            <DollarSign className="mr-1.5 h-4 w-4" />
            Budget
          </TabsTrigger>
        </TabsList>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="mt-6">
          {data.vendors.length === 0 ? (
            <Card className="border-[#E8E4DF]">
              <CardContent className="py-12 text-center">
                <p className="text-[#7A7A7A]">No vendors added yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {sortedCategories.map(([key, { name, vendors: catVendors }]) => (
                <div key={key}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#7A7A7A]">
                    {name}{" "}
                    <span className="font-normal">({catVendors.length})</span>
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {catVendors.map((vendor) => (
                      <SharedVendorCard
                        key={vendor.id}
                        vendor={vendor}
                        token={token}
                        partnerName={partnerName}
                        existingReaction={reactionsMap.get(vendor.id) ?? null}
                        onReacted={handleReacted}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reaction summary */}
          {data.reactions.length > 0 && (
            <div className="mt-6 rounded-lg border border-[#E8E4DF] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#2D2D2D]">
                Your Reactions Summary
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.reactions.map((r) => {
                  const vendor = data.vendors.find(
                    (v) => v.id === r.vendor_id
                  );
                  if (!vendor) return null;
                  return (
                    <span
                      key={r.vendor_id}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        r.reaction === "thumbs_up"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {r.reaction === "thumbs_up" ? "👍" : "👎"}{" "}
                      {vendor.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="mt-6">
          {totalBudget > 0 && (
            <Card className="mb-6 border-[#E8E4DF]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#7A7A7A]">Total Budget</p>
                    <p className="text-3xl font-bold text-[#2D2D2D]">
                      {formatPrice(totalBudget)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#7A7A7A]">Remaining</p>
                    <p
                      className={`text-3xl font-bold ${
                        totalBudget - committed >= 0
                          ? "text-[#8B9F82]"
                          : "text-red-500"
                      }`}
                    >
                      {formatPrice(totalBudget - committed)}
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#E8E4DF]">
                  <div
                    className="h-full rounded-full bg-[#8B9F82] transition-all"
                    style={{
                      width: `${Math.min((committed / totalBudget) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-[#7A7A7A]">
                  {Math.round((committed / totalBudget) * 100)}% allocated
                </p>
              </CardContent>
            </Card>
          )}

          {data.budgetItems.length === 0 ? (
            <Card className="border-[#E8E4DF]">
              <CardContent className="py-12 text-center">
                <p className="text-[#7A7A7A]">No budget items yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-[#E8E4DF]">
              <CardHeader>
                <CardTitle className="text-[#2D2D2D]">Budget Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.budgetItems.map((item) => {
                    // Payment status is synced from vendor data by the API
                    let paymentLabel: string;
                    let paymentColor: string;
                    if (item.is_paid) {
                      paymentLabel = "Paid in full";
                      paymentColor = "text-[#8B9F82]";
                    } else if (item.deposit_paid) {
                      paymentLabel = "Deposit paid";
                      paymentColor = "text-[#C9A96E]";
                    } else {
                      paymentLabel = "Not paid yet";
                      paymentColor = "text-[#7A7A7A]";
                    }

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-[#E8E4DF] px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-[#2D2D2D]">
                            {item.description}
                          </p>
                          {item.vendor_categories && (
                            <p className="text-xs text-[#7A7A7A]">
                              {(item.vendor_categories as { name: string }).name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#2D2D2D]">
                            {formatPrice(
                              item.actual_cost || item.estimated_cost
                            )}
                          </p>
                          <span className={`text-xs ${paymentColor}`}>
                            {paymentLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-12 border-t border-[#E8E4DF] pt-6 text-center text-xs text-[#7A7A7A]">
        <p>
          Powered by{" "}
          <span className="font-semibold text-[#8B9F82]">Altared</span> &middot;
          Wedding Planning Made Simple
        </p>
      </div>
    </div>
  );
}

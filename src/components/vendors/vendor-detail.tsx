'use client';

import { useState, useMemo } from 'react';
import {
  Star,
  Globe,
  Mail,
  Phone,
  Instagram,
  ExternalLink,
  Edit3,
  Save,
  X,
  Loader2,
  DollarSign,
  Calendar,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VendorStatusBadge } from './vendor-status-badge';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
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

const formatPrice = (price: number | null) => {
  if (price === null || price === undefined) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
};

const sourceLabels: Record<VendorSource, string> = {
  manual: 'Manual Entry',
  the_knot: 'The Knot',
  wedding_wire: 'WeddingWire',
  referral: 'Referral',
  other: 'Other',
};

type PaymentStatus = 'paid_in_full' | 'deposit_paid' | 'unpaid';

function getPaymentStatus(vendor: Vendor): PaymentStatus {
  const meta = vendor.metadata as Record<string, unknown> | null;
  const stored = meta?.payment_status as PaymentStatus | undefined;
  if (stored) return stored;
  // Infer from legacy fields
  if (vendor.deposit_paid && vendor.deposit_amount && vendor.deposit_amount >= (vendor.final_price || vendor.quoted_price || Infinity)) {
    return 'paid_in_full';
  }
  if (vendor.deposit_paid) return 'deposit_paid';
  return 'unpaid';
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid_in_full: { label: 'Paid in Full', color: 'text-[#047857]', bg: 'bg-[#047857]/10' },
  deposit_paid: { label: 'Deposit Paid', color: 'text-[#C9A96E]', bg: 'bg-[#C9A96E]/10' },
  unpaid: { label: 'No Payment', color: 'text-[#DC2626]', bg: 'bg-[#DC2626]/10' },
};

function PaymentStatusCard({ vendor, onUpdate }: { vendor: Vendor; onUpdate?: (v: Vendor) => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [saving, setSaving] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(getPaymentStatus(vendor));
  const [depositAmount, setDepositAmount] = useState(vendor.deposit_amount?.toString() ?? '');

  const totalPrice = vendor.final_price || vendor.quoted_price;
  const currentStatus = getPaymentStatus(vendor);
  const statusInfo = PAYMENT_STATUS_LABELS[currentStatus];

  async function savePayment() {
    setSaving(true);
    try {
      const amount = paymentStatus === 'paid_in_full'
        ? (totalPrice ?? 0)
        : paymentStatus === 'deposit_paid'
          ? (depositAmount ? parseFloat(depositAmount) : 0)
          : 0;

      const { data, error } = await supabase
        .from('vendors')
        .update({
          deposit_paid: paymentStatus !== 'unpaid',
          deposit_amount: amount,
          metadata: { ...((vendor.metadata as Record<string, unknown>) ?? {}), payment_status: paymentStatus },
        })
        .eq('id', vendor.id)
        .select('*, vendor_categories(*)')
        .single();

      if (error) throw error;
      toast.success('Payment updated');
      setEditingPayment(false);
      onUpdate?.(data as Vendor);
    } catch {
      toast.error('Failed to update payment');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base text-[#2D2D2D]">Payment</CardTitle>
        {!editingPayment && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPaymentStatus(currentStatus);
              setDepositAmount(vendor.deposit_amount?.toString() ?? '');
              setEditingPayment(true);
            }}
            className="text-xs text-[#7A7A7A] hover:text-[#2D2D2D]"
          >
            <Edit3 className="size-3.5 mr-1" />
            Update
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editingPayment ? (
          <div className="space-y-3">
            {(['paid_in_full', 'deposit_paid', 'unpaid'] as PaymentStatus[]).map((status) => {
              const info = PAYMENT_STATUS_LABELS[status];
              const isSelected = paymentStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setPaymentStatus(status)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-[#8B9F82] bg-[#8B9F82]/5'
                      : 'border-[#E5E7EB] hover:border-[#8B9F82]/50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#2D2D2D]">{info.label}</p>
                    {status === 'paid_in_full' && totalPrice && (
                      <p className="text-xs text-[#7A7A7A]">Full amount: {formatPrice(totalPrice)}</p>
                    )}
                  </div>
                  <div className={`flex size-5 items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-[#8B9F82] bg-[#8B9F82]' : 'border-[#D1D5DB]'
                  }`}>
                    {isSelected && <div className="size-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}

            {paymentStatus === 'deposit_paid' && (
              <div className="space-y-1.5">
                <Label htmlFor="payment-deposit">Deposit Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7A7A7A]">$</span>
                  <Input
                    id="payment-deposit"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="pl-7"
                    min={0}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingPayment(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={saving || (paymentStatus === 'deposit_paid' && !depositAmount)}
                onClick={savePayment}
                className="bg-[#8B9F82] hover:bg-[#7A8E71] text-white"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : 'Save Payment'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.color} ${statusInfo.bg}`}>
                {statusInfo.label}
              </span>
            </div>

            {/* Amount paid */}
            {currentStatus !== 'unpaid' && (
              <div className="flex items-center gap-3">
                <DollarSign className="size-4 text-[#7A7A7A] shrink-0" />
                <div>
                  <p className="text-xs text-[#7A7A7A] mb-0.5">Amount Paid</p>
                  <p className="text-sm font-medium text-[#2D2D2D]">
                    {formatPrice(vendor.deposit_amount)}
                    {totalPrice && currentStatus === 'deposit_paid' && (
                      <span className="text-xs text-[#7A7A7A] ml-1">
                        of {formatPrice(totalPrice)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Remaining balance */}
            {currentStatus === 'deposit_paid' && totalPrice && vendor.deposit_amount != null && (
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-[#7A7A7A] shrink-0" />
                <div>
                  <p className="text-xs text-[#7A7A7A] mb-0.5">Remaining Balance</p>
                  <p className="text-sm font-medium text-[#DC2626]">
                    {formatPrice(totalPrice - vendor.deposit_amount)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type EditData = {
  name: string;
  company_name: string;
  category_id: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  quoted_price: string;
  final_price: string;
  deposit_amount: string;
  deposit_due_date: string;
  notes: string;
};

function InfoRow({
  icon: Icon,
  label,
  value,
  editField,
  type = 'text',
  href,
  isEditing,
  editData,
  setEditData,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  editField?: keyof EditData;
  type?: string;
  href?: string;
  isEditing: boolean;
  editData: EditData;
  setEditData: React.Dispatch<React.SetStateAction<EditData>>;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="size-4 text-[#7A7A7A] mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#7A7A7A] mb-0.5">{label}</p>
        {isEditing && editField ? (
          <Input
            type={type}
            value={editData[editField]}
            onChange={(e) =>
              setEditData((prev) => ({ ...prev, [editField]: e.target.value }))
            }
            className="h-7 text-sm"
          />
        ) : value ? (
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#1D4ED8] hover:underline flex items-center gap-1"
            >
              {value}
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <p className="text-sm text-[#2D2D2D]">{value}</p>
          )
        ) : (
          <p className="text-sm text-[#7A7A7A] italic">Not provided</p>
        )}
      </div>
    </div>
  );
}

interface VendorDetailProps {
  vendor: Vendor;
  onUpdate?: (updatedVendor: Vendor) => void;
}

export function VendorDetail({ vendor, onUpdate }: VendorDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string | null }[]>([]);
  const [editData, setEditData] = useState({
    name: vendor.name,
    company_name: vendor.company_name ?? '',
    category_id: vendor.category_id ?? '',
    email: vendor.email ?? '',
    phone: vendor.phone ?? '',
    website: vendor.website ?? '',
    instagram: vendor.instagram ?? '',
    quoted_price: vendor.quoted_price?.toString() ?? '',
    final_price: vendor.final_price?.toString() ?? '',
    deposit_amount: vendor.deposit_amount?.toString() ?? '',
    deposit_due_date: vendor.deposit_due_date ?? '',
    notes: vendor.notes ?? '',
  });

  const supabase = useMemo(() => createClient(), []);

  async function startEditing() {
    // Fetch categories first so the dropdown renders with labels, not UUIDs
    if (categories.length === 0) {
      const { data } = await supabase
        .from('vendor_categories')
        .select('id, name, icon')
        .order('sort_order');
      if (data) setCategories(data);
    }
    setEditData({
      name: vendor.name,
      company_name: vendor.company_name ?? '',
      category_id: vendor.category_id ?? '',
      email: vendor.email ?? '',
      phone: vendor.phone ?? '',
      website: vendor.website ?? '',
      instagram: vendor.instagram ?? '',
      quoted_price: vendor.quoted_price?.toString() ?? '',
      final_price: vendor.final_price?.toString() ?? '',
      deposit_amount: vendor.deposit_amount?.toString() ?? '',
      deposit_due_date: vendor.deposit_due_date ?? '',
      notes: vendor.notes ?? '',
    });
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const updatePayload = {
        name: editData.name,
        company_name: editData.company_name || null,
        category_id: editData.category_id || null,
        email: editData.email || null,
        phone: editData.phone || null,
        website: editData.website || null,
        instagram: editData.instagram || null,
        quoted_price: editData.quoted_price ? parseFloat(editData.quoted_price) : null,
        final_price: editData.final_price ? parseFloat(editData.final_price) : null,
        deposit_amount: editData.deposit_amount ? parseFloat(editData.deposit_amount) : null,
        deposit_due_date: editData.deposit_due_date || null,
        notes: editData.notes || null,
      };

      const { data, error } = await supabase
        .from('vendors')
        .update(updatePayload)
        .eq('id', vendor.id)
        .select('*, vendor_categories(*)')
        .single();

      if (error) throw error;

      toast.success('Vendor updated successfully');
      setIsEditing(false);
      onUpdate?.(data as Vendor);
    } catch (err) {
      console.error('Error updating vendor:', err);
      toast.error('Failed to update vendor');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with edit toggle */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {isEditing ? (
              <Input
                value={editData.name}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="text-xl font-semibold h-9 w-64"
                placeholder="Vendor name"
              />
            ) : (
              <h2 className="text-xl font-semibold text-[#2D2D2D]">{vendor.name}</h2>
            )}
            <VendorStatusBadge status={vendor.status} />
          </div>
          {isEditing ? (
            <Input
              value={editData.company_name}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, company_name: e.target.value }))
              }
              className="text-sm h-7 w-64 mt-1"
              placeholder="Company name (optional)"
            />
          ) : vendor.company_name ? (
            <p className="text-sm text-[#7A7A7A]">{vendor.company_name}</p>
          ) : null}
          {isEditing ? (
            <Select
              value={editData.category_id}
              onValueChange={(val) =>
                setEditData((prev) => ({ ...prev, category_id: val ?? '' }))
              }
            >
              <SelectTrigger className="mt-2 h-8 w-64 text-sm">
                <SelectValue placeholder="Select category">
                  {(value: string) => categories.find((c) => c.id === value)?.name ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} label={cat.name}>
                    {cat.icon && <span className="mr-1">{getVendorEmoji(cat.icon)}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : vendor.vendor_categories ? (
            <Badge
              variant="secondary"
              className="mt-2 bg-[#8B9F82]/10 text-[#8B9F82] border-transparent"
            >
              {vendor.vendor_categories.icon && (
                <span className="mr-1">{getVendorEmoji(vendor.vendor_categories.icon)}</span>
              )}
              {vendor.vendor_categories.name}
            </Badge>
          ) : (
            <p className="mt-2 text-sm text-[#7A7A7A] italic">No category</p>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEditing} disabled={saving}>
                <X className="size-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={saving}
                className="bg-[#8B9F82] hover:bg-[#7A8E71] text-white"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Edit3 className="size-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#2D2D2D]">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              icon={Mail}
              label="Email"
              value={vendor.email}
              editField="email"
              type="email"
              href={vendor.email ? `mailto:${vendor.email}` : undefined}
              isEditing={isEditing}
              editData={editData}
              setEditData={setEditData}
            />
            <InfoRow
              icon={Phone}
              label="Phone"
              value={vendor.phone}
              editField="phone"
              type="tel"
              href={vendor.phone ? `tel:${vendor.phone}` : undefined}
              isEditing={isEditing}
              editData={editData}
              setEditData={setEditData}
            />
            <InfoRow
              icon={Globe}
              label="Website"
              value={vendor.website?.replace(/^https?:\/\//, '') ?? null}
              editField="website"
              type="url"
              href={vendor.website ? (!/^https?:\/\//i.test(vendor.website) ? `https://${vendor.website}` : vendor.website) : undefined}
              isEditing={isEditing}
              editData={editData}
              setEditData={setEditData}
            />
            <InfoRow
              icon={Instagram}
              label="Instagram"
              value={vendor.instagram}
              editField="instagram"
              href={
                vendor.instagram
                  ? `https://instagram.com/${vendor.instagram.replace('@', '')}`
                  : undefined
              }
              isEditing={isEditing}
              editData={editData}
              setEditData={setEditData}
            />
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#2D2D2D]">Pricing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              icon={DollarSign}
              label="Quoted Price"
              value={formatPrice(vendor.quoted_price)}
              editField="quoted_price"
              type="number"
              isEditing={isEditing}
              editData={editData}
              setEditData={setEditData}
            />
            <InfoRow
              icon={DollarSign}
              label="Final Price"
              value={formatPrice(vendor.final_price)}
              editField="final_price"
              type="number"
              isEditing={isEditing}
              editData={editData}
              setEditData={setEditData}
            />
            <InfoRow
              icon={Calendar}
              label="Final Payment Due Date"
              value={
                vendor.deposit_due_date
                  ? new Date(vendor.deposit_due_date).toLocaleDateString()
                  : null
              }
              editField="deposit_due_date"
              type="date"
              isEditing={isEditing}
              editData={editData}
              setEditData={setEditData}
            />
          </CardContent>
        </Card>

        {/* Payment Status */}
        <PaymentStatusCard vendor={vendor} onUpdate={onUpdate} />

        {/* Rating & Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#2D2D2D]">Rating & Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-[#7A7A7A] mb-1">Rating</p>
              {vendor.rating !== null && vendor.rating !== undefined ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-5 ${
                        i < vendor.rating!
                          ? 'fill-[#C9A96E] text-[#C9A96E]'
                          : 'fill-transparent text-[#D1D5DB]'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-[#2D2D2D] font-medium">
                    {vendor.rating}/5
                  </span>
                </div>
              ) : (
                <p className="text-sm text-[#7A7A7A] italic">No rating</p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs text-[#7A7A7A] mb-1">Source</p>
              <p className="text-sm text-[#2D2D2D]">
                {vendor.source ? sourceLabels[vendor.source] : 'Not specified'}
              </p>
              {vendor.source_url && (
                <a
                  href={vendor.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#1D4ED8] hover:underline flex items-center gap-1 mt-0.5"
                >
                  View listing <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-xs text-[#7A7A7A] mb-1">Added</p>
              <p className="text-sm text-[#2D2D2D]">
                {new Date(vendor.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#2D2D2D] flex items-center gap-2">
              <Tag className="size-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendor.tags && vendor.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {vendor.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[#4B5563] border-[#E5E7EB]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7A7A7A] italic">No tags</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#2D2D2D]">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editData.notes}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={4}
              placeholder="Add notes about this vendor..."
            />
          ) : vendor.notes ? (
            <p className="text-sm text-[#2D2D2D] whitespace-pre-wrap">{vendor.notes}</p>
          ) : (
            <p className="text-sm text-[#7A7A7A] italic">No notes</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

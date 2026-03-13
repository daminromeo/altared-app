'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Upload,
  MessageSquare,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VendorDetail } from '@/components/vendors/vendor-detail';
import { VendorStatusBadge } from '@/components/vendors/vendor-status-badge';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { BookingPaymentDialog, type BookingPaymentInfo } from '@/components/shared/booking-payment-dialog';
import { PartnerFeedbackPanel } from '@/components/share/partner-feedback-panel';

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

const STATUS_PIPELINE: VendorStatus[] = [
  'researching',
  'contacted',
  'quoted',
  'meeting_scheduled',
  'negotiating',
  'booked',
];

const statusLabels: Record<VendorStatus, string> = {
  researching: 'Researching',
  contacted: 'Contacted',
  quoted: 'Quoted',
  meeting_scheduled: 'Meeting',
  negotiating: 'Negotiating',
  booked: 'Booked',
  declined: 'Declined',
  archived: 'Archived',
};

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'note' | 'message' | 'booking';
  title: string;
  description: string;
  timestamp: string;
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [booking, setBooking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Proposals linked to this vendor
  const [proposals, setProposals] = useState<
    { id: string; file_name: string; file_url: string; file_size: number | null; scan_status: string; created_at: string }[]
  >([]);
  const [messages] = useState<{ id: string; subject: string; date: string; preview: string }[]>([]);
  const [timeline] = useState<TimelineEvent[]>(() => {
    // Generate timeline from vendor data once loaded
    return [];
  });

  const fetchVendor = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*, vendor_categories(*)')
        .eq('id', vendorId)
        .single();

      if (error) throw error;
      setVendor(data as Vendor);
    } catch (err) {
      console.error('Error fetching vendor:', err);
      toast.error('Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  const fetchProposals = useCallback(async () => {
    const { data } = await supabase
      .from('proposals')
      .select('id, file_name, file_url, file_size, scan_status, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    if (data) setProposals(data);
  }, [vendorId]);

  useEffect(() => {
    fetchVendor();
    fetchProposals();
  }, [fetchVendor, fetchProposals]);

  async function updateStatus(newStatus: VendorStatus) {
    if (!vendor) return;

    // Show booking payment dialog instead of directly booking
    if (newStatus === 'booked') {
      setBookingDialogOpen(true);
      return;
    }

    setUpdatingStatus(true);
    try {
      const updateData: Record<string, unknown> = { status: newStatus };

      const { data, error } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', vendor.id)
        .select('*, vendor_categories(*)')
        .single();

      if (error) {
        console.error('Supabase update error:', JSON.stringify(error, null, 2));
        toast.error(`Failed to update status: ${error.message || error.code || JSON.stringify(error)}`);
        return;
      }
      setVendor(data as Vendor);
      toast.success(`Status updated to ${statusLabels[newStatus]}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleBookingConfirm(paymentInfo: BookingPaymentInfo) {
    if (!vendor) return;
    setBooking(true);
    try {
      const updateData: Record<string, unknown> = {
        status: 'booked',
        is_booked: true,
        booked_date: new Date().toISOString().split('T')[0],
      };

      if (paymentInfo.paymentStatus === 'paid_in_full') {
        updateData.deposit_paid = true;
        updateData.metadata = { ...vendor.metadata, payment_status: 'paid_in_full' };
      } else if (paymentInfo.paymentStatus === 'deposit_paid') {
        updateData.deposit_paid = true;
        updateData.deposit_amount = paymentInfo.amountPaid;
      }

      const { data, error } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', vendor.id)
        .select('*, vendor_categories(*)')
        .single();

      if (error) throw error;
      setVendor(data as Vendor);
      toast.success(`${vendor.name} has been booked!`);
    } catch (err) {
      console.error('Error booking vendor:', err);
      toast.error('Failed to book vendor');
    } finally {
      setBooking(false);
    }
  }

  async function deleteVendor() {
    if (!vendor) return;
    setDeleting(true);
    try {
      // Delete linked budget items so they don't linger with stale data
      await supabase
        .from('budget_items')
        .delete()
        .eq('vendor_id', vendor.id);

      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendor.id);

      if (error) throw error;
      toast.success(`${vendor.name} has been deleted`);
      router.push('/vendors');
    } catch (err) {
      console.error('Error deleting vendor:', err);
      toast.error('Failed to delete vendor');
      setDeleting(false);
    }
  }

  function buildTimeline(): TimelineEvent[] {
    if (!vendor) return [];
    const events: TimelineEvent[] = [];

    events.push({
      id: 'created',
      type: 'note',
      title: 'Vendor Added',
      description: `${vendor.name} was added to your vendor list.`,
      timestamp: vendor.created_at,
    });

    if (vendor.status !== 'researching') {
      events.push({
        id: 'status-current',
        type: 'status_change',
        title: `Status: ${statusLabels[vendor.status]}`,
        description: `Current status is ${statusLabels[vendor.status]}.`,
        timestamp: vendor.updated_at,
      });
    }

    if (vendor.is_booked && vendor.booked_date) {
      events.push({
        id: 'booked',
        type: 'booking',
        title: 'Vendor Booked',
        description: `${vendor.name} was booked.`,
        timestamp: vendor.booked_date,
      });
    }

    return events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async function deleteProposal(proposalId: string, fileUrl: string) {
    await supabase.storage.from('proposals').remove([fileUrl]);
    const { error } = await supabase.from('proposals').delete().eq('id', proposalId);
    if (error) {
      toast.error('Failed to delete proposal');
      return;
    }
    setProposals((prev) => prev.filter((p) => p.id !== proposalId));
    toast.success('Proposal deleted');
  }

  async function viewProposalPdf(fileUrl: string) {
    const { data, error } = await supabase.storage
      .from('proposals')
      .createSignedUrl(fileUrl, 300);
    if (error || !data?.signedUrl) {
      toast.error('Failed to load PDF');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#8B9F82]" />
          <p className="text-sm text-[#7A7A7A]">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="size-10 text-[#DC2626] mb-3" />
        <h3 className="text-lg font-medium text-[#2D2D2D] mb-1">Vendor not found</h3>
        <p className="text-sm text-[#7A7A7A] mb-4">
          The vendor you are looking for does not exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => router.push('/vendors')}>
          <ArrowLeft className="size-4" />
          Back to Vendors
        </Button>
      </div>
    );
  }

  const currentPipelineIndex = STATUS_PIPELINE.indexOf(vendor.status);
  const timelineEvents = buildTimeline();

  return (
    <div className="space-y-6">
      {/* Back button + Book action */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/vendors')}>
          <ArrowLeft className="size-4" />
          Back to Vendors
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-[#DC2626] border-[#DC2626]/30 hover:bg-[#DC2626]/5 hover:text-[#DC2626]"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>

          {!vendor.is_booked && (
            <Button
              size="lg"
              onClick={() => setBookingDialogOpen(true)}
              disabled={booking}
              className="bg-[#8B9F82] hover:bg-[#7A8E71] text-white shadow-md"
            >
              {booking ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Book This Vendor
                </>
              )}
            </Button>
          )}

          {vendor.is_booked && (
            <div className="flex items-center gap-2 rounded-lg bg-[#D1FAE5] px-4 py-2 text-sm font-medium text-[#047857]">
              <CheckCircle2 className="size-4" />
              Booked
              {vendor.booked_date && (
                <span className="text-xs font-normal">
                  on {new Date(vendor.booked_date).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#DC2626]/10">
                <Trash2 className="size-5 text-[#DC2626]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2D2D2D]">Delete Vendor</h3>
            </div>
            <p className="text-sm text-[#7A7A7A] mb-1">
              Are you sure you want to delete <span className="font-medium text-[#2D2D2D]">{vendor.name}</span>?
            </p>
            <p className="text-xs text-[#7A7A7A] mb-5">
              This action cannot be undone. All associated data including notes, pricing, payment history, and linked budget items will be permanently removed.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={deleteVendor}
                disabled={deleting}
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#2D2D2D]">Status Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STATUS_PIPELINE.map((status, index) => {
              const isActive = vendor.status === status;
              const isPast = currentPipelineIndex > index;
              const isFuture = currentPipelineIndex < index;

              return (
                <div key={status} className="flex items-center gap-1">
                  <button
                    onClick={() => updateStatus(status)}
                    disabled={updatingStatus || isActive}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#8B9F82] text-white shadow-sm'
                        : isPast
                        ? 'bg-[#8B9F82]/20 text-[#8B9F82] hover:bg-[#8B9F82]/30'
                        : 'bg-[#F3F4F6] text-[#7A7A7A] hover:bg-[#E5E7EB]'
                    }`}
                  >
                    {statusLabels[status]}
                  </button>
                  {index < STATUS_PIPELINE.length - 1 && (
                    <div
                      className={`h-0.5 w-4 shrink-0 ${
                        isPast ? 'bg-[#8B9F82]' : 'bg-[#E5E7EB]'
                      }`}
                    />
                  )}
                </div>
              );
            })}

            <Separator orientation="vertical" className="mx-2 h-6" />

            {/* Decline / Archive */}
            <button
              onClick={() => updateStatus('declined')}
              disabled={updatingStatus || vendor.status === 'declined'}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                vendor.status === 'declined'
                  ? 'bg-[#FEE2E2] text-[#DC2626]'
                  : 'bg-[#F3F4F6] text-[#7A7A7A] hover:bg-[#FEE2E2] hover:text-[#DC2626]'
              }`}
            >
              Declined
            </button>
            <button
              onClick={() => updateStatus('archived')}
              disabled={updatingStatus || vendor.status === 'archived'}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                vendor.status === 'archived'
                  ? 'bg-[#F3F4F6] text-[#6B7280]'
                  : 'bg-[#F3F4F6] text-[#7A7A7A] hover:bg-[#E5E7EB]'
              }`}
            >
              Archived
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Vendor detail component */}
      <VendorDetail
        vendor={vendor}
        onUpdate={(updated) => setVendor(updated)}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Proposals section */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base text-[#2D2D2D] flex items-center gap-2">
              <FileText className="size-4" />
              Proposals & Contracts
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/proposals/upload')}
            >
              <Upload className="size-3.5" />
              Upload
            </Button>
          </CardHeader>
          <CardContent>
            {proposals.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="size-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-sm text-[#7A7A7A]">No proposals or contracts yet</p>
                <p className="text-xs text-[#7A7A7A] mt-1">
                  Upload PDF proposals or contracts from this vendor
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-[#8B9F82]" />
                      <div>
                        <p className="text-sm font-medium text-[#2D2D2D]">
                          {proposal.file_name}
                        </p>
                        <p className="text-xs text-[#7A7A7A]">
                          {new Date(proposal.created_at).toLocaleDateString()}
                          {proposal.file_size ? ` · ${formatFileSize(proposal.file_size)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewProposalPdf(proposal.file_url)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => deleteProposal(proposal.id, proposal.file_url)}
                        className="text-[#7A7A7A] hover:text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#2D2D2D] flex items-center gap-2">
              <MessageSquare className="size-4" />
              Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare className="size-8 text-[#D1D5DB] mx-auto mb-2" />
                <p className="text-sm text-[#7A7A7A]">No messages yet</p>
                <p className="text-xs text-[#7A7A7A] mt-1">
                  Messages with this vendor will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-lg border border-[#E5E7EB] p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-[#2D2D2D]">
                        {message.subject}
                      </p>
                      <span className="text-xs text-[#7A7A7A]">{message.date}</span>
                    </div>
                    <p className="text-xs text-[#7A7A7A] line-clamp-2">
                      {message.preview}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Partner feedback */}
      <PartnerFeedbackPanel vendorId={vendor.id} />

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#2D2D2D] flex items-center gap-2">
            <Clock className="size-4" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timelineEvents.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="size-8 text-[#D1D5DB] mx-auto mb-2" />
              <p className="text-sm text-[#7A7A7A]">No timeline events yet</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {timelineEvents.map((event, index) => {
                const iconMap = {
                  status_change: <VendorStatusBadge status={vendor.status} />,
                  note: <FileText className="size-3.5 text-[#8B9F82]" />,
                  message: <MessageSquare className="size-3.5 text-[#1D4ED8]" />,
                  booking: <CheckCircle2 className="size-3.5 text-[#047857]" />,
                };

                return (
                  <div key={event.id} className="flex gap-3 pb-4 last:pb-0">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center size-7 rounded-full bg-[#F3F4F6] shrink-0">
                        {event.type === 'status_change' ? (
                          <Clock className="size-3.5 text-[#8B9F82]" />
                        ) : (
                          iconMap[event.type]
                        )}
                      </div>
                      {index < timelineEvents.length - 1 && (
                        <div className="w-px flex-1 bg-[#E5E7EB] mt-1" />
                      )}
                    </div>

                    {/* Event content */}
                    <div className="pt-0.5 pb-2">
                      <p className="text-sm font-medium text-[#2D2D2D]">
                        {event.title}
                      </p>
                      <p className="text-xs text-[#7A7A7A] mt-0.5">
                        {event.description}
                      </p>
                      <p className="text-xs text-[#7A7A7A] mt-1">
                        {new Date(event.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <BookingPaymentDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        vendorName={vendor.name}
        vendorPrice={vendor.quoted_price ?? vendor.final_price ?? null}
        onConfirm={handleBookingConfirm}
      />
    </div>
  );
}

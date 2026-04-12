'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { Users, GripVertical, DollarSign, CreditCard, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type PipelineStage =
  | 'researching'
  | 'contacted'
  | 'quoted'
  | 'meeting'
  | 'negotiating'
  | 'booked'
  | 'declined'

export type PaymentStatus = 'paid_in_full' | 'deposit_paid' | 'unpaid'

export interface PipelineVendor {
  id: string
  name: string
  category: string
  price: number | null
  stage: PipelineStage
}

export interface BookingPaymentInfo {
  paymentStatus: PaymentStatus
  amountPaid: number
}

interface VendorPipelineProps {
  vendors: PipelineVendor[]
  loading?: boolean
  onStageChange?: (vendorId: string, newStage: PipelineStage, paymentInfo?: BookingPaymentInfo) => void
}

const stages: { key: PipelineStage; label: string; color: string; dropColor: string; badgeClass: string }[] = [
  { key: 'researching', label: 'Researching', color: 'bg-gray-100 text-gray-700', dropColor: 'bg-gray-200/60', badgeClass: 'bg-gray-100 text-gray-600' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-50 text-blue-700', dropColor: 'bg-blue-100/60', badgeClass: 'bg-blue-50 text-blue-600' },
  { key: 'quoted', label: 'Quoted', color: 'bg-amber-50 text-amber-700', dropColor: 'bg-amber-100/60', badgeClass: 'bg-amber-50 text-amber-600' },
  { key: 'meeting', label: 'Meeting', color: 'bg-purple-50 text-purple-700', dropColor: 'bg-purple-100/60', badgeClass: 'bg-purple-50 text-purple-600' },
  { key: 'negotiating', label: 'Negotiating', color: 'bg-orange-50 text-orange-700', dropColor: 'bg-orange-100/60', badgeClass: 'bg-orange-50 text-orange-600' },
  { key: 'booked', label: 'Booked', color: 'bg-[#8B9F82]/10 text-[#8B9F82]', dropColor: 'bg-[#8B9F82]/20', badgeClass: 'bg-[#8B9F82]/10 text-[#8B9F82]' },
  { key: 'declined', label: 'Declined', color: 'bg-red-50 text-red-700', dropColor: 'bg-red-100/60', badgeClass: 'bg-red-50 text-red-600' },
]

function getStage(key: PipelineStage) {
  return stages.find((s) => s.key === key) ?? stages[0]
}

function formatPrice(price: number | null): string {
  if (price === null) return 'TBD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function BookingPaymentDialog({
  open,
  onOpenChange,
  vendorName,
  vendorPrice,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorName: string
  vendorPrice: number | null
  onConfirm: (info: BookingPaymentInfo) => void
}) {
  const [selected, setSelected] = useState<PaymentStatus | null>(null)
  const [depositAmount, setDepositAmount] = useState('')

  function handleConfirm() {
    if (!selected) return

    let amountPaid = 0
    if (selected === 'paid_in_full') {
      amountPaid = vendorPrice ?? 0
    } else if (selected === 'deposit_paid') {
      amountPaid = depositAmount ? parseFloat(depositAmount) : 0
    }

    onConfirm({ paymentStatus: selected, amountPaid })
    setSelected(null)
    setDepositAmount('')
    onOpenChange(false)
  }

  function handleCancel() {
    setSelected(null)
    setDepositAmount('')
    onOpenChange(false)
  }

  const options: { value: PaymentStatus; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      value: 'paid_in_full',
      label: 'Paid in Full',
      description: vendorPrice ? `Full amount: ${formatPrice(vendorPrice)}` : 'Mark as fully paid',
      icon: DollarSign,
    },
    {
      value: 'deposit_paid',
      label: 'Paid Deposit',
      description: 'Enter deposit amount below',
      icon: CreditCard,
    },
    {
      value: 'unpaid',
      label: 'No Payment Yet',
      description: 'Will pay later',
      icon: Clock,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#2D2D2D]">Booking Payment</DialogTitle>
          <DialogDescription>
            You&apos;re booking <span className="font-medium text-[#2D2D2D]">{vendorName}</span>. How would you like to record the payment?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {options.map((opt) => {
            const Icon = opt.icon
            const isSelected = selected === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? 'border-[#8B9F82] bg-[#8B9F82]/5'
                    : 'border-[#E5E7EB] hover:border-[#8B9F82]/50 hover:bg-[#FAF8F5]'
                }`}
              >
                <div className={`flex size-9 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-[#8B9F82]/10' : 'bg-[#FAF8F5]'
                }`}>
                  <Icon className={`size-4 ${isSelected ? 'text-[#8B9F82]' : 'text-[#7A7A7A]'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isSelected ? 'text-[#2D2D2D]' : 'text-[#2D2D2D]'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-[#7A7A7A]">{opt.description}</p>
                </div>
                <div className={`flex size-5 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected ? 'border-[#8B9F82] bg-[#8B9F82]' : 'border-[#D1D5DB]'
                }`}>
                  {isSelected && (
                    <div className="size-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {selected === 'deposit_paid' && (
          <div className="space-y-1.5">
            <Label htmlFor="deposit-amount">Deposit Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7A7A7A]">$</span>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="pl-7"
                min={0}
                autoFocus
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selected || (selected === 'deposit_paid' && !depositAmount)}
            onClick={handleConfirm}
            className="bg-[#8B9F82] hover:bg-[#7A8E71] text-white"
          >
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Mobile: Grouped list view with stage selector ─────────────────────────────

function MobilePipeline({
  vendorsByStage,
  onStageChange,
  onBookingRequest,
}: {
  vendorsByStage: { key: PipelineStage; label: string; badgeClass: string; vendors: PipelineVendor[] }[]
  onStageChange?: VendorPipelineProps['onStageChange']
  onBookingRequest: (vendorId: string) => void
}) {
  const router = useRouter()
  const activeStages = vendorsByStage.filter((s) => s.vendors.length > 0)

  function handleStageSelect(vendorId: string, newStage: PipelineStage) {
    if (newStage === 'booked') {
      onBookingRequest(vendorId)
    } else if (onStageChange) {
      onStageChange(vendorId, newStage)
    }
  }

  return (
    <div className="space-y-3">
      {activeStages.map((stage) => (
        <div key={stage.key}>
          {/* Stage header */}
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${stage.badgeClass}`}>
              {stage.label}
            </span>
            <span className="text-[11px] text-[#7A7A7A]">
              {stage.vendors.length}
            </span>
          </div>

          {/* Vendor rows */}
          <div className="space-y-1.5">
            {stage.vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-black/5"
              >
                {/* Vendor info — tappable */}
                <button
                  onClick={() => router.push(`/vendors/${vendor.id}`)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-medium text-[#2D2D2D] truncate">
                    {vendor.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-[#7A7A7A] truncate">{vendor.category}</span>
                    <span className="text-xs font-semibold text-[#C9A96E]">{formatPrice(vendor.price)}</span>
                  </div>
                </button>

                {/* Stage selector */}
                {onStageChange ? (
                  <select
                    value={vendor.stage}
                    onChange={(e) => handleStageSelect(vendor.id, e.target.value as PipelineStage)}
                    className="shrink-0 rounded-md border border-[#E8E4DF] bg-[#FAF8F5] px-2 py-1.5 text-xs font-medium text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#8B9F82]/30"
                  >
                    {stages.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-[#7A7A7A]" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Show empty stages summary */}
      {vendorsByStage.filter((s) => s.vendors.length === 0).length > 0 && (
        <p className="text-center text-[11px] text-[#7A7A7A] pt-1">
          {vendorsByStage
            .filter((s) => s.vendors.length === 0)
            .map((s) => s.label)
            .join(', ')}{' '}
          — no vendors
        </p>
      )}
    </div>
  )
}

// ── Desktop: Kanban drag-and-drop view ────────────────────────────────────────

function DesktopPipeline({
  vendorsByStage,
  onStageChange,
  onBookingRequest,
}: {
  vendorsByStage: { key: PipelineStage; label: string; dropColor: string; vendors: PipelineVendor[] }[]
  onStageChange?: VendorPipelineProps['onStageChange']
  onBookingRequest: (vendorId: string) => void
}) {
  const router = useRouter()
  const [draggedVendor, setDraggedVendor] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null)
  const dragSourceStage = useRef<PipelineStage | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, vendorId: string, stage: PipelineStage) => {
    setDraggedVendor(vendorId)
    dragSourceStage.current = stage
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', vendorId)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }, [])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedVendor(null)
    setDragOverStage(null)
    dragSourceStage.current = null
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, stageKey: PipelineStage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageKey)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as HTMLElement | null
    if (!e.currentTarget.contains(related)) {
      setDragOverStage(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault()
    const vendorId = e.dataTransfer.getData('text/plain')
    setDraggedVendor(null)
    setDragOverStage(null)

    if (vendorId && dragSourceStage.current !== targetStage) {
      if (targetStage === 'booked') {
        onBookingRequest(vendorId)
      } else if (onStageChange) {
        onStageChange(vendorId, targetStage)
      }
    }
    dragSourceStage.current = null
  }, [onStageChange, onBookingRequest])

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
      {vendorsByStage.map((stage) => {
        const isDropTarget = dragOverStage === stage.key && dragSourceStage.current !== stage.key

        return (
          <div
            key={stage.key}
            className={`w-[160px] lg:w-[180px] shrink-0 rounded-lg p-2 transition-colors duration-150 ${
              isDropTarget
                ? `${stage.dropColor} ring-2 ring-inset ring-[#8B9F82]/30`
                : 'bg-[#FAF8F5]'
            }`}
            onDragOver={(e) => handleDragOver(e, stage.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.key)}
          >
            {/* Column header */}
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-[#2D2D2D]">
                {stage.label}
              </span>
              <span className="flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-medium text-[#7A7A7A]">
                {stage.vendors.length}
              </span>
            </div>

            {/* Vendor cards */}
            <div className="space-y-2 min-h-[60px]">
              {stage.vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  draggable={!!onStageChange}
                  onDragStart={(e) => handleDragStart(e, vendor.id, stage.key)}
                  onDragEnd={handleDragEnd}
                  className={`group w-full rounded-lg bg-white p-2.5 text-left shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md ${
                    onStageChange ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  } ${draggedVendor === vendor.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-1.5">
                    {onStageChange && (
                      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-[#7A7A7A]/40 group-hover:text-[#7A7A7A]/70 transition-colors" />
                    )}
                    <button
                      onClick={() => router.push(`/vendors/${vendor.id}`)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm font-medium text-[#2D2D2D] truncate">
                        {vendor.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[#7A7A7A] truncate">
                        {vendor.category}
                      </p>
                      <p className="mt-1.5 text-xs font-semibold text-[#C9A96E]">
                        {formatPrice(vendor.price)}
                      </p>
                    </button>
                  </div>
                </div>
              ))}

              {stage.vendors.length === 0 && (
                <div className={`rounded-lg border border-dashed p-3 text-center transition-colors ${
                  isDropTarget
                    ? 'border-[#8B9F82]/40 bg-[#8B9F82]/5'
                    : 'border-[#7A7A7A]/20'
                }`}>
                  <p className="text-[11px] text-[#7A7A7A]">
                    {isDropTarget ? 'Drop here' : 'No vendors'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function VendorPipeline({ vendors, loading, onStageChange }: VendorPipelineProps) {
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [pendingBookingVendorId, setPendingBookingVendorId] = useState<string | null>(null)

  const pendingVendor = pendingBookingVendorId ? vendors.find((v) => v.id === pendingBookingVendorId) : null

  const handleBookingRequest = useCallback((vendorId: string) => {
    setPendingBookingVendorId(vendorId)
    setBookingDialogOpen(true)
  }, [])

  const handleBookingConfirm = useCallback((info: BookingPaymentInfo) => {
    if (pendingBookingVendorId && onStageChange) {
      onStageChange(pendingBookingVendorId, 'booked', info)
    }
    setPendingBookingVendorId(null)
  }, [pendingBookingVendorId, onStageChange])

  if (loading) {
    return (
      <Card className="bg-white p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-36 rounded bg-[#FAF8F5]" />
          {/* Mobile skeleton */}
          <div className="sm:hidden space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-[#FAF8F5]" />
            ))}
          </div>
          {/* Desktop skeleton */}
          <div className="hidden sm:flex gap-3 overflow-hidden">
            {stages.map((stage) => (
              <div
                key={stage.key}
                className="w-[160px] lg:w-[200px] shrink-0 space-y-2 rounded-lg bg-[#FAF8F5] p-3"
              >
                <div className="h-4 w-20 rounded bg-white" />
                <div className="h-16 rounded bg-white" />
                <div className="h-16 rounded bg-white" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (vendors.length === 0) {
    return (
      <Card className="bg-white">
        <EmptyState
          icon={Users}
          title="No vendors yet"
          description="Start adding vendors to see them in your pipeline."
          actionLabel="Add Vendor"
          actionHref="/vendors"
        />
      </Card>
    )
  }

  const vendorsByStage = stages.map((stage) => ({
    ...stage,
    vendors: vendors.filter((v) => v.stage === stage.key),
  }))

  return (
    <>
      <Card className="bg-white p-3 sm:p-4">
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <h2
            className="text-base font-semibold text-[#2D2D2D]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Vendor Pipeline
          </h2>
          {onStageChange && (
            <span className="hidden sm:inline text-[11px] text-[#7A7A7A]">
              Drag vendors to move between stages
            </span>
          )}
        </div>

        {/* Mobile: grouped list view */}
        <div className="sm:hidden">
          <MobilePipeline
            vendorsByStage={vendorsByStage}
            onStageChange={onStageChange}
            onBookingRequest={handleBookingRequest}
          />
        </div>

        {/* Desktop: kanban drag-and-drop */}
        <div className="hidden sm:block">
          <DesktopPipeline
            vendorsByStage={vendorsByStage}
            onStageChange={onStageChange}
            onBookingRequest={handleBookingRequest}
          />
        </div>
      </Card>

      <BookingPaymentDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        vendorName={pendingVendor?.name ?? ''}
        vendorPrice={pendingVendor?.price ?? null}
        onConfirm={handleBookingConfirm}
      />
    </>
  )
}

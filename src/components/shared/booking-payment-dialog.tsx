'use client'

import { useState } from 'react'
import { DollarSign, CreditCard, Clock } from 'lucide-react'
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

export type PaymentStatus = 'paid_in_full' | 'deposit_paid' | 'unpaid'

export interface BookingPaymentInfo {
  paymentStatus: PaymentStatus
  amountPaid: number
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

interface BookingPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorName: string
  vendorPrice: number | null
  onConfirm: (info: BookingPaymentInfo) => void
}

export function BookingPaymentDialog({
  open,
  onOpenChange,
  vendorName,
  vendorPrice,
  onConfirm,
}: BookingPaymentDialogProps) {
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
          <DialogTitle className="text-ink">Booking Payment</DialogTitle>
          <DialogDescription>
            You&apos;re booking <span className="font-medium text-ink">{vendorName}</span>. How would you like to record the payment?
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
                    ? 'border-moss bg-moss/5'
                    : 'border-[#E5E7EB] hover:border-moss/50 hover:bg-paper'
                }`}
              >
                <div className={`flex size-9 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-moss/10' : 'bg-paper'
                }`}>
                  <Icon className={`size-4 ${isSelected ? 'text-moss' : 'text-ink-muted'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">
                    {opt.label}
                  </p>
                  <p className="text-xs text-ink-muted">{opt.description}</p>
                </div>
                <div className={`flex size-5 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected ? 'border-moss bg-moss' : 'border-[#D1D5DB]'
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">$</span>
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
            className="bg-moss hover:bg-moss-light text-white"
          >
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

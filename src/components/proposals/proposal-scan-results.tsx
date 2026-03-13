'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Check, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils/format'

interface PaymentScheduleItem {
  description: string
  amount: number
  dueDate: string
}

export interface ScanResultData {
  vendorName: string
  totalPrice: number
  depositAmount: number
  depositDueDate: string
  services: string[]
  terms: string
  cancellationPolicy: string
  notes: string
  paymentSchedule: PaymentScheduleItem[]
}

interface ProposalScanResultsProps {
  proposalId: string
  data: ScanResultData
  vendors: Array<{ id: string; name: string }>
  initialVendorId?: string
  onSaved: () => void
}

export function ProposalScanResults({
  proposalId,
  data,
  vendors,
  initialVendorId = '',
  onSaved,
}: ProposalScanResultsProps) {
  const supabase = useMemo(() => createClient(), [])
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<ScanResultData>(data)
  const [selectedVendorId, setSelectedVendorId] = useState<string>(initialVendorId)
  const [newServiceTag, setNewServiceTag] = useState('')

  function updateField<K extends keyof ScanResultData>(
    key: K,
    value: ScanResultData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addService() {
    const tag = newServiceTag.trim()
    if (!tag || form.services.includes(tag)) return
    updateField('services', [...form.services, tag])
    setNewServiceTag('')
  }

  function removeService(service: string) {
    updateField(
      'services',
      form.services.filter((s) => s !== service)
    )
  }

  function updatePaymentItem(
    index: number,
    field: keyof PaymentScheduleItem,
    value: string | number
  ) {
    const updated = [...form.paymentSchedule]
    updated[index] = { ...updated[index], [field]: value }
    updateField('paymentSchedule', updated)
  }

  function addPaymentItem() {
    updateField('paymentSchedule', [
      ...form.paymentSchedule,
      { description: '', amount: 0, dueDate: '' },
    ])
  }

  function removePaymentItem(index: number) {
    updateField(
      'paymentSchedule',
      form.paymentSchedule.filter((_, i) => i !== index)
    )
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('proposals')
        .update({
          extracted_vendor_name: form.vendorName,
          extracted_total_price: form.totalPrice,
          extracted_deposit_amount: form.depositAmount,
          extracted_deposit_due_date: form.depositDueDate || null,
          extracted_services: form.services,
          extracted_terms: form.terms,
          extracted_cancellation_policy: form.cancellationPolicy,
          extracted_notes: form.notes,
          extracted_payment_schedule: JSON.parse(JSON.stringify(form.paymentSchedule)),
          vendor_id: selectedVendorId || null,
          scan_status: 'completed',
        })
        .eq('id', proposalId)

      if (error) throw error

      toast.success('Proposal saved successfully')
      onSaved()
    } catch (err) {
      console.error('Error saving proposal:', err)
      toast.error('Failed to save proposal. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* AI confidence banner */}
      <div className="flex items-center gap-3 rounded-lg border border-[#C9A96E]/30 bg-[#C9A96E]/5 px-4 py-3">
        <AlertTriangle className="size-5 shrink-0 text-[#C9A96E]" />
        <div>
          <p className="text-sm font-medium text-[#2D2D2D]">
            AI Extracted &mdash; Please verify
          </p>
          <p className="text-xs text-[#7A7A7A]">
            Review the extracted data below and make corrections before saving.
          </p>
        </div>
      </div>

      {/* Link to vendor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-[#2D2D2D]">Link to Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedVendorId} onValueChange={(v) => setSelectedVendorId(v ?? '')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a vendor or create new">
                {(value: string) => {
                  if (value === '__new__') return '+ Create new vendor'
                  return vendors.find((v) => v.id === value)?.name ?? value
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__new__">+ Create new vendor</SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id} label={v.name}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Extracted fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-[#2D2D2D]">Proposal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                value={form.vendorName}
                onChange={(e) => updateField('vendorName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totalPrice">Total Price</Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                value={form.totalPrice}
                onChange={(e) =>
                  updateField('totalPrice', parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="depositAmount">Deposit Amount</Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.01"
                value={form.depositAmount}
                onChange={(e) =>
                  updateField('depositAmount', parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="depositDueDate">Deposit Due Date</Label>
              <Input
                id="depositDueDate"
                type="date"
                value={form.depositDueDate}
                onChange={(e) => updateField('depositDueDate', e.target.value)}
              />
            </div>
          </div>

          {/* Services tags */}
          <div className="mt-4 space-y-1.5">
            <Label>Services</Label>
            <div className="flex flex-wrap gap-2">
              {form.services.map((service) => (
                <span
                  key={service}
                  className="inline-flex items-center gap-1 rounded-full bg-[#8B9F82]/10 px-3 py-1 text-xs font-medium text-[#8B9F82]"
                >
                  {service}
                  <button
                    type="button"
                    onClick={() => removeService(service)}
                    className="ml-0.5 rounded-full hover:bg-[#8B9F82]/20"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                placeholder="Add a service..."
                value={newServiceTag}
                onChange={(e) => setNewServiceTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addService()
                  }
                }}
                className="max-w-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addService}
                disabled={!newServiceTag.trim()}
              >
                <Plus className="size-3" />
                Add
              </Button>
            </div>
          </div>

          {/* Terms & policies */}
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="terms">Terms</Label>
              <Textarea
                id="terms"
                value={form.terms}
                onChange={(e) => updateField('terms', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
              <Textarea
                id="cancellationPolicy"
                value={form.cancellationPolicy}
                onChange={(e) =>
                  updateField('cancellationPolicy', e.target.value)
                }
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-[#2D2D2D]">
              Payment Schedule
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addPaymentItem}>
              <Plus className="size-3" />
              Add Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {form.paymentSchedule.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.paymentSchedule.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updatePaymentItem(idx, 'description', e.target.value)
                        }
                        className="h-7 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) =>
                          updatePaymentItem(
                            idx,
                            'amount',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-7 w-28 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) =>
                          updatePaymentItem(idx, 'dueDate', e.target.value)
                        }
                        className="h-7 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removePaymentItem(idx)}
                        className="text-[#7A7A7A] hover:text-red-600"
                      >
                        <X className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-4 text-center text-sm text-[#7A7A7A]">
              No payment schedule extracted. Click &ldquo;Add Payment&rdquo; to add
              one manually.
            </p>
          )}
          {form.paymentSchedule.length > 0 && (
            <div className="mt-3 flex justify-end border-t pt-3">
              <p className="text-sm font-semibold text-[#2D2D2D]">
                Total:{' '}
                {formatCurrency(
                  form.paymentSchedule.reduce((sum, p) => sum + p.amount, 0)
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
          size="lg"
        >
          {isSaving ? (
            <>
              <span className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Check className="size-4" />
              Confirm &amp; Save
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

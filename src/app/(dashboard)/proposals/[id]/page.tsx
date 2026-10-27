'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface Proposal {
  id: string
  file_name: string
  file_url: string
  file_size: number | null
  scan_status: string
  extracted_vendor_name: string | null
  extracted_total_price: number | null
  extracted_deposit_amount: number | null
  extracted_deposit_due_date: string | null
  extracted_services: string[] | null
  extracted_terms: string | null
  extracted_cancellation_policy: string | null
  extracted_notes: string | null
  extracted_payment_schedule: { description: string; amount: number; dueDate: string }[] | null
  vendor_id: string | null
  created_at: string
  vendors: { id: string; name: string } | null
}

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const proposalId = params.id as string

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProposal = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('proposals')
      .select('*, vendors(id, name)')
      .eq('id', proposalId)
      .single()

    if (error || !data) {
      setProposal(null)
    } else {
      setProposal(data as unknown as Proposal)
    }
    setLoading(false)
  }, [supabase, proposalId])

  useEffect(() => {
    fetchProposal()
  }, [fetchProposal])

  async function viewPdf() {
    if (!proposal) return
    const { data, error } = await supabase.storage
      .from('proposals')
      .createSignedUrl(proposal.file_url, 300)
    if (error || !data?.signedUrl) {
      toast.error('Failed to load PDF')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  async function handleDelete() {
    if (!proposal) return
    await supabase.storage.from('proposals').remove([proposal.file_url])
    const { error } = await supabase.from('proposals').delete().eq('id', proposal.id)
    if (error) {
      toast.error('Failed to delete quote')
      return
    }
    toast.success('Quote deleted')
    router.push('/proposals')
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-moss" />
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="size-10 text-error mb-3" />
        <h3 className="text-lg font-medium text-ink mb-1">Quote not found</h3>
        <p className="text-sm text-ink-muted mb-4">
          This quote may have been deleted.
        </p>
        <Button variant="outline" onClick={() => router.push('/proposals')}>
          <ArrowLeft className="size-4" />
          Back to Quotes
        </Button>
      </div>
    )
  }

  const schedule = proposal.extracted_payment_schedule ?? []
  const services = proposal.extracted_services ?? []

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/proposals">
            <Button variant="ghost" size="icon-sm" className="text-ink-muted">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {proposal.extracted_vendor_name || proposal.file_name}
            </h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {proposal.file_name}
              {proposal.file_size ? ` · ${formatFileSize(proposal.file_size)}` : ''}
              {' · '}Uploaded {formatDate(proposal.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={viewPdf}>
            <ExternalLink className="size-3.5" />
            View PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-error border-error/30 hover:bg-error/5 hover:text-error"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Linked vendor */}
      {proposal.vendors && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-muted">Linked to:</span>
          <Link
            href={`/vendors/${proposal.vendor_id}`}
            className="font-medium text-moss hover:underline"
          >
            {proposal.vendors.name}
          </Link>
        </div>
      )}

      {/* Scan status */}
      {proposal.scan_status !== 'completed' && (
        <Badge
          className={
            proposal.scan_status === 'failed'
              ? 'bg-red-100 text-red-700 border-0'
              : 'bg-ink-muted/10 text-ink-muted border-0'
          }
        >
          Scan: {proposal.scan_status}
        </Badge>
      )}

      {/* Pricing overview */}
      {(proposal.extracted_total_price || proposal.extracted_deposit_amount) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-ink">Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {proposal.extracted_total_price != null && (
                <div>
                  <p className="text-xs text-ink-muted">Total Price</p>
                  <p className="text-lg font-semibold text-ink">
                    {formatCurrency(proposal.extracted_total_price)}
                  </p>
                </div>
              )}
              {proposal.extracted_deposit_amount != null && (
                <div>
                  <p className="text-xs text-ink-muted">Deposit</p>
                  <p className="text-lg font-semibold text-ink">
                    {formatCurrency(proposal.extracted_deposit_amount)}
                  </p>
                </div>
              )}
              {proposal.extracted_deposit_due_date && (
                <div>
                  <p className="text-xs text-ink-muted">Deposit Due</p>
                  <p className="text-lg font-semibold text-ink">
                    {formatDate(proposal.extracted_deposit_due_date)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-ink">Services Included</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <span
                  key={service}
                  className="rounded-full bg-moss/10 px-3 py-1 text-xs font-medium text-moss"
                >
                  {service}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment schedule */}
      {schedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-ink">Payment Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm">{item.description}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.dueDate ? formatDate(item.dueDate) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-3 flex justify-end border-t pt-3">
              <p className="text-sm font-semibold text-ink">
                Total: {formatCurrency(schedule.reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terms & policies */}
      {(proposal.extracted_terms || proposal.extracted_cancellation_policy || proposal.extracted_notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-ink">Terms & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposal.extracted_terms && (
              <div>
                <p className="text-xs font-medium text-ink-muted mb-1">Terms</p>
                <p className="whitespace-pre-wrap text-sm text-ink">
                  {proposal.extracted_terms}
                </p>
              </div>
            )}
            {proposal.extracted_cancellation_policy && (
              <div>
                <p className="text-xs font-medium text-ink-muted mb-1">Cancellation Policy</p>
                <p className="whitespace-pre-wrap text-sm text-ink">
                  {proposal.extracted_cancellation_policy}
                </p>
              </div>
            )}
            {proposal.extracted_notes && (
              <div>
                <p className="text-xs font-medium text-ink-muted mb-1">Notes</p>
                <p className="whitespace-pre-wrap text-sm text-ink">
                  {proposal.extracted_notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProposalUpload } from '@/components/proposals/proposal-upload'
import {
  ProposalScanResults,
  type ScanResultData,
} from '@/components/proposals/proposal-scan-results'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { UpgradePrompt } from '@/components/upgrade-prompt'

interface Vendor {
  id: string
  name: string
}

type UploadStage = 'select' | 'uploading' | 'scanning' | 'results' | 'error'

export default function UploadProposalPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { canUseFeature, isLoading: subLoading } = useSubscription()

  const [file, setFile] = useState<File | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState<string>('')
  const [stage, setStage] = useState<UploadStage>('select')
  const [proposalId, setProposalId] = useState<string | null>(null)
  const [scanResults, setScanResults] = useState<ScanResultData | null>(null)
  const [scanProgress, setScanProgress] = useState(0)

  useEffect(() => {
    async function fetchVendors() {
      const { data } = await supabase
        .from('vendors')
        .select('id, name')
        .order('name')
      if (data) setVendors(data)
    }
    fetchVendors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileSelect = useCallback((f: File | null) => {
    setFile(f)
    if (!f) {
      setStage('select')
      setScanResults(null)
      setProposalId(null)
    }
  }, [])

  async function handleUpload() {
    if (!file) return

    setStage('uploading')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in')

      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const filePath = `${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('proposals')
        .upload(filePath, file, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      // 2. Create proposal record
      const { data: proposal, error: insertError } = await supabase
        .from('proposals')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: filePath,
          file_size: file.size,
          vendor_id: selectedVendorId || null,
          scan_status: 'pending',
        })
        .select('id')
        .single()

      if (insertError || !proposal)
        throw new Error(`Failed to create proposal record: ${insertError?.message}`)

      setProposalId(proposal.id)

      // 3. Trigger scan
      setStage('scanning')
      setScanProgress(0)

      // Simulate progress while waiting for scan
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 600)

      const scanResponse = await fetch('/api/proposals/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: proposal.id }),
      })

      clearInterval(progressInterval)

      if (!scanResponse.ok) {
        const errorData = await scanResponse.json().catch(() => ({}))
        console.error('Scan API error details:', JSON.stringify(errorData, null, 2))
        throw new Error(errorData.details || errorData.error || 'Scan failed')
      }

      const scanData = await scanResponse.json()
      setScanProgress(100)

      // Map API response fields to ScanResultData shape
      const raw = scanData.scanResult ?? scanData.results ?? {}

      // Build full payment schedule: deposit first, then remaining items
      const depositAmt = typeof raw.depositAmount === 'number' ? raw.depositAmount : parseFloat(String(raw.depositAmount)) || 0
      const rawSchedule = (raw.paymentSchedule ?? []).map(
        (p: { description?: string; amount?: number; dueDate?: string }) => ({
          description: p.description ?? '',
          amount: typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount)) || 0,
          dueDate: p.dueDate ?? '',
        })
      )
      const fullSchedule = depositAmt > 0
        ? [{ description: 'Deposit / Retainer', amount: depositAmt, dueDate: raw.depositDueDate ?? '' }, ...rawSchedule]
        : rawSchedule

      const mapped: ScanResultData = {
        vendorName: raw.vendorName ?? '',
        totalPrice: raw.totalCost ?? raw.totalPrice ?? 0,
        depositAmount: depositAmt,
        depositDueDate: raw.depositDueDate ?? '',
        services: raw.services ?? [],
        terms: raw.terms ?? '',
        cancellationPolicy: raw.cancellationPolicy ?? '',
        notes: raw.notes ?? '',
        paymentSchedule: fullSchedule,
      }

      setScanResults(mapped)
      setStage('results')

      toast.success('Proposal scanned successfully')
    } catch (err) {
      console.error('Upload/scan error:', err)
      setStage('error')
      toast.error(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      )
    }
  }

  function handleSaved() {
    toast.success('Proposal confirmed and saved')
    router.push('/proposals')
  }

  // Gate behind subscription
  if (!subLoading && !canUseFeature('proposal_scanning')) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/proposals">
            <Button variant="ghost" size="icon-sm" className="text-[#7A7A7A]">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#2D2D2D]">
              Upload Proposal
            </h1>
          </div>
        </div>
        <UpgradePrompt
          title="AI Proposal Scanning"
          description="Upload vendor proposals and let AI automatically extract pricing, services, payment schedules, and contract terms. Upgrade to Pro to unlock this feature."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/proposals">
          <Button variant="ghost" size="icon-sm" className="text-[#7A7A7A]">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2D2D2D]">
            Upload Proposal
          </h1>
          <p className="mt-0.5 text-sm text-[#7A7A7A]">
            Upload a vendor proposal PDF for AI-powered data extraction.
          </p>
        </div>
      </div>

      {/* Upload section */}
      {stage !== 'results' && (
        <div className="space-y-6 rounded-xl border bg-white p-6">
          {/* File drop zone */}
          <div className="space-y-1.5">
            <Label className="text-[#2D2D2D]">Proposal PDF</Label>
            <ProposalUpload
              onFileSelect={handleFileSelect}
              selectedFile={file}
              isUploading={stage === 'uploading'}
            />
          </div>

          {/* Vendor selection */}
          <div className="space-y-1.5">
            <Label className="text-[#2D2D2D]">Vendor</Label>
            <Select
              value={selectedVendorId}
              onValueChange={(v) => setSelectedVendorId(v ?? '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a vendor (optional)">
                  {(value: string) => {
                    if (value === '__new__') return '+ Create new vendor'
                    return vendors.find((v) => v.id === value)?.name ?? value
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__new__" label="+ Create new vendor">+ Create new vendor</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id} label={v.name}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#7A7A7A]">
              Associate this proposal with an existing vendor, or leave blank to
              assign later.
            </p>
          </div>

          {/* Upload button */}
          {stage === 'select' && (
            <Button
              onClick={handleUpload}
              disabled={!file}
              className="w-full bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
              size="lg"
            >
              <Sparkles className="size-4" />
              Upload &amp; Scan Proposal
            </Button>
          )}

          {/* Scanning animation */}
          {stage === 'scanning' && (
            <div className="space-y-4 rounded-lg bg-[#FAF8F5] p-6">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="flex size-16 items-center justify-center rounded-full bg-[#8B9F82]/10">
                    <Sparkles className="size-7 text-[#8B9F82]" />
                  </div>
                  <Loader2 className="absolute -right-1 -top-1 size-6 animate-spin text-[#C9A96E]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#2D2D2D]">
                    Scanning proposal with AI...
                  </p>
                  <p className="mt-1 text-xs text-[#7A7A7A]">
                    Extracting vendor details, pricing, services, and payment terms.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#8B9F82]/20">
                  <div
                    className="h-full rounded-full bg-[#8B9F82] transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(scanProgress, 100)}%` }}
                  />
                </div>
                <p className="text-center text-xs text-[#7A7A7A]">
                  {Math.round(Math.min(scanProgress, 100))}% complete
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {stage === 'error' && (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm font-medium text-red-800">
                Something went wrong during the scan.
              </p>
              <p className="text-xs text-red-600">
                Please try uploading again or contact support if the issue persists.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStage('select')
                  setFile(null)
                  setScanResults(null)
                }}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Scan results */}
      {stage === 'results' && scanResults && proposalId && (
        <ProposalScanResults
          proposalId={proposalId}
          data={scanResults}
          vendors={vendors}
          initialVendorId={selectedVendorId}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

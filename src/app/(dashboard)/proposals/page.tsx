'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Plus, FileText, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ProposalCard,
  type ScanStatus,
} from '@/components/proposals/proposal-card'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { useSubscription } from '@/lib/hooks/use-subscription'

interface Proposal {
  id: string
  file_name: string
  file_url: string
  scan_status: ScanStatus
  extracted_total_price: number | null
  created_at: string
  vendor_id: string | null
  vendors: { id: string; name: string } | null
}

interface Vendor {
  id: string
  name: string
}

export default function ProposalsPage() {
  const { isFreePlan, canUseFeature } = useSubscription()
  const supabase = useMemo(() => createClient(), [])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [proposalsRes, vendorsRes] = await Promise.all([
        supabase
          .from('proposals')
          .select('id, file_name, file_url, scan_status, extracted_total_price, created_at, vendor_id, vendors(id, name)')
          .order('created_at', { ascending: false }),
        supabase.from('vendors').select('id, name').order('name'),
      ])

      if (proposalsRes.data) {
        setProposals(proposalsRes.data as unknown as Proposal[])
      }
      if (vendorsRes.data) {
        setVendors(vendorsRes.data)
      }
    } catch (err) {
      console.error('Proposals fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleDelete(proposalId: string) {
    // Also delete the file from storage
    const proposal = proposals.find((p) => p.id === proposalId)
    if (proposal) {
      await supabase.storage.from('proposals').remove([proposal.file_url])
    }

    const { error } = await supabase.from('proposals').delete().eq('id', proposalId)
    if (error) {
      toast.error('Failed to delete proposal')
      return
    }
    setProposals((prev) => prev.filter((p) => p.id !== proposalId))
    toast.success('Proposal deleted')
  }

  const filtered = useMemo(() => {
    return proposals.filter((p) => {
      if (statusFilter !== 'all' && p.scan_status !== statusFilter) return false
      if (vendorFilter !== 'all' && p.vendor_id !== vendorFilter) return false
      if (
        searchQuery &&
        !p.file_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.vendors?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false
      return true
    })
  }, [proposals, statusFilter, vendorFilter, searchQuery])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2D2D2D]">
            Proposals
          </h1>
          <p className="mt-1 text-sm text-[#7A7A7A]">
            Upload and manage vendor proposals with AI-powered scanning.
          </p>
        </div>
        <Link href="/proposals/upload">
          <Button className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]">
            <Plus className="size-4" />
            Upload Proposal
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#7A7A7A]" />
          <Input
            placeholder="Search proposals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="scanning">Scanning</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vendorFilter} onValueChange={(v) => setVendorFilter(v ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All vendors">
              {(value: string) => {
                if (value === 'all') return 'All vendors'
                return vendors.find((v) => v.id === value)?.name ?? value
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vendors</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id} label={v.name}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* AI scanning upgrade prompt for free users */}
      {isFreePlan && proposals.length > 0 && (
        <UpgradePrompt
          title="AI Proposal Scanning"
          description="Upgrade to automatically extract costs, terms, and schedules from your proposals."
          compact
        />
      )}

      {/* Proposals grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[160px] animate-pulse rounded-xl bg-[#FAF8F5]"
            />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProposalCard
              key={p.id}
              id={p.id}
              fileName={p.file_name}
              vendorName={p.vendors?.name ?? null}
              scanStatus={p.scan_status}
              extractedPrice={p.extracted_total_price}
              uploadedAt={p.created_at}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#C9A96E]/30 bg-[#FAF8F5] py-16">
          <div className="flex size-16 items-center justify-center rounded-full bg-[#C9A96E]/10">
            <FileText className="size-7 text-[#C9A96E]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[#2D2D2D]">
            No proposals found
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-[#7A7A7A]">
            {proposals.length === 0
              ? 'Upload your first vendor proposal to get started. Our AI will extract key details automatically.'
              : 'No proposals match your current filters. Try adjusting your search criteria.'}
          </p>
          {proposals.length === 0 && (
            <Link href="/proposals/upload" className="mt-4">
              <Button className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]">
                <Plus className="size-4" />
                Upload Proposal
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { FileText, Clock, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils/format'

export type ScanStatus = 'pending' | 'scanning' | 'completed' | 'failed'

export interface ProposalCardProps {
  id: string
  fileName: string
  vendorName: string | null
  scanStatus: ScanStatus
  extractedPrice: number | null
  uploadedAt: string
  onDelete?: (id: string) => void
}

const statusConfig: Record<
  ScanStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-[#7A7A7A]/10 text-[#7A7A7A]',
  },
  scanning: {
    label: 'Scanning',
    icon: Loader2,
    className: 'bg-blue-100 text-blue-700 animate-pulse',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-[#8B9F82]/10 text-[#8B9F82]',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-red-100 text-red-700',
  },
}

export function ProposalCard({
  id,
  fileName,
  vendorName,
  scanStatus,
  extractedPrice,
  uploadedAt,
  onDelete,
}: ProposalCardProps) {
  const status = statusConfig[scanStatus]
  const StatusIcon = status.icon

  return (
    <Link href={`/proposals/${id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md hover:ring-[#8B9F82]/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#FAF8F5]">
                <FileText className="size-5 text-[#8B9F82]" />
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-sm font-semibold text-[#2D2D2D]">
                  {fileName}
                </CardTitle>
                {vendorName && (
                  <p className="mt-0.5 text-xs text-[#7A7A7A]">{vendorName}</p>
                )}
              </div>
            </div>
            <Badge
              className={cn(
                'shrink-0 gap-1 border-0 text-xs font-medium',
                status.className
              )}
            >
              <StatusIcon
                className={cn(
                  'size-3',
                  scanStatus === 'scanning' && 'animate-spin'
                )}
              />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {extractedPrice !== null ? (
              <p className="text-lg font-semibold text-[#2D2D2D]">
                {formatCurrency(extractedPrice)}
              </p>
            ) : (
              <p className="text-sm text-[#7A7A7A]">Price not extracted</p>
            )}
            <div className="flex items-center gap-2">
              <p className="text-xs text-[#7A7A7A]">
                {formatDate(uploadedAt)}
              </p>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDelete(id)
                  }}
                  className="text-[#7A7A7A] hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

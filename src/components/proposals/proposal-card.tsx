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
    className: 'bg-ink-muted/10 text-ink-muted',
  },
  scanning: {
    label: 'Scanning',
    icon: Loader2,
    className: 'bg-blue-100 text-blue-700 animate-pulse',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-moss/10 text-moss',
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
      <Card className="cursor-pointer transition-shadow hover:shadow-md hover:ring-moss/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-paper">
                <FileText className="size-5 text-moss" />
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate text-sm font-semibold text-ink">
                  {fileName}
                </CardTitle>
                {vendorName && (
                  <p className="mt-0.5 text-xs text-ink-muted">{vendorName}</p>
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
              <p className="text-lg font-semibold text-ink">
                {formatCurrency(extractedPrice)}
              </p>
            ) : (
              <p className="text-sm text-ink-muted">Price not extracted</p>
            )}
            <div className="flex items-center gap-2">
              <p className="text-xs text-ink-muted">
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
                  className="text-ink-muted hover:text-red-600"
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

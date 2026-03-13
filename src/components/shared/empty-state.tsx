import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-[#FAF8F5]">
        <Icon className="size-6 text-[#7A7A7A]" />
      </div>
      <h3
        className="mt-4 text-base font-semibold text-[#2D2D2D]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-[#7A7A7A]">{description}</p>

      {actionLabel && (actionHref || onAction) && (
        <div className="mt-5">
          {actionHref ? (
            <Link href={actionHref}>
              <Button
                variant="default"
                className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
              >
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button
              variant="default"
              onClick={onAction}
              className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

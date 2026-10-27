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
      <div className="flex size-12 items-center justify-center rounded-xl bg-paper">
        <Icon className="size-6 text-ink-muted" />
      </div>
      <h3
        className="mt-4 text-base font-semibold text-ink"
        style={{ fontFamily: "var(--font-manrope), sans-serif" }}
      >
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>

      {actionLabel && (actionHref || onAction) && (
        <div className="mt-5">
          {actionHref ? (
            <Link href={actionHref}>
              <Button
                variant="default"
                className="bg-moss text-white hover:bg-moss-light"
              >
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button
              variant="default"
              onClick={onAction}
              className="bg-moss text-white hover:bg-moss-light"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

function Shimmer({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-[#FAF8F5]',
        className
      )}
    />
  )
}

export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white p-4 ring-1 ring-black/5',
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="size-9 rounded-lg" />
        </div>
        <Shimmer className="h-8 w-20" />
        <Shimmer className="h-3 w-40" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({
  columns = 5,
  className,
}: SkeletonProps & { columns?: number }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 border-b border-border px-4 py-3',
        className
      )}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Shimmer
          key={i}
          className={cn(
            'h-4',
            i === 0 ? 'w-40' : i === columns - 1 ? 'w-16 ml-auto' : 'w-24 flex-1'
          )}
        />
      ))}
    </div>
  )
}

export function ListSkeleton({
  rows = 5,
  className,
}: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Shimmer className="size-8 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-4 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Pipeline */}
      <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
        <Shimmer className="mb-4 h-5 w-36" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="w-[180px] shrink-0 space-y-2 rounded-lg bg-[#FAF8F5] p-2"
            >
              <Shimmer className="h-4 w-20 bg-white" />
              <Shimmer className="h-20 bg-white" />
              <Shimmer className="h-20 bg-white" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
          <Shimmer className="mb-4 h-5 w-36" />
          <ListSkeleton rows={5} />
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
          <Shimmer className="mb-4 h-5 w-36" />
          <ListSkeleton rows={5} />
        </div>
      </div>
    </div>
  )
}

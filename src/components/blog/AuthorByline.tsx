import { format } from "date-fns"

export function AuthorByline({
  author,
  publishedAt,
  readingMinutes,
}: {
  author?: string
  publishedAt: string
  readingMinutes: number
}) {
  const name = author ?? "Altared Team"
  return (
    <div className="not-prose mt-6 flex items-center gap-3 text-sm text-[#5A5A5A]">
      <div
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8B9F82] text-xs font-semibold text-white"
      >
        {initials(name)}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-medium text-[#2D2D2D]">{name}</span>
        <span className="text-xs text-[#7A7A7A]">
          {format(new Date(publishedAt), "MMMM d, yyyy")} · {readingMinutes} min
          read
        </span>
      </div>
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

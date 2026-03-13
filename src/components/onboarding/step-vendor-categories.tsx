'use client'

import {
  BuildingIcon,
  CameraIcon,
  MusicIcon,
  FlowerIcon,
  ShirtIcon,
  CakeIcon,
  MailIcon,
  CarIcon,
  SparklesIcon,
  VideoIcon,
  UtensilsIcon,
  UsersIcon,
} from 'lucide-react'

export interface VendorCategoriesData {
  selectedCategories: string[]
}

interface StepVendorCategoriesProps {
  data: VendorCategoriesData
  onChange: (data: VendorCategoriesData) => void
}

interface VendorCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  bgColor: string
}

const VENDOR_CATEGORIES: VendorCategory[] = [
  {
    id: 'venue',
    name: 'Venue',
    description: 'Ceremony & reception location',
    icon: BuildingIcon,
    color: '#8B9F82',
    bgColor: 'rgba(139, 159, 130, 0.12)',
  },
  {
    id: 'photographer',
    name: 'Photographer',
    description: 'Capture your special moments',
    icon: CameraIcon,
    color: '#C9A96E',
    bgColor: 'rgba(201, 169, 110, 0.12)',
  },
  {
    id: 'videographer',
    name: 'Videographer',
    description: 'Cinematic wedding films',
    icon: VideoIcon,
    color: '#C4A0A0',
    bgColor: 'rgba(196, 160, 160, 0.12)',
  },
  {
    id: 'caterer',
    name: 'Caterer',
    description: 'Food & beverage service',
    icon: UtensilsIcon,
    color: '#D4956A',
    bgColor: 'rgba(212, 149, 106, 0.12)',
  },
  {
    id: 'florist',
    name: 'Florist',
    description: 'Bouquets & floral arrangements',
    icon: FlowerIcon,
    color: '#A8C5A0',
    bgColor: 'rgba(168, 197, 160, 0.12)',
  },
  {
    id: 'music',
    name: 'DJ / Band',
    description: 'Music & entertainment',
    icon: MusicIcon,
    color: '#9BB5C9',
    bgColor: 'rgba(155, 181, 201, 0.12)',
  },
  {
    id: 'cake',
    name: 'Cake / Bakery',
    description: 'Wedding cake & desserts',
    icon: CakeIcon,
    color: '#D4B896',
    bgColor: 'rgba(212, 184, 150, 0.12)',
  },
  {
    id: 'attire',
    name: 'Attire',
    description: 'Wedding dress & suits',
    icon: ShirtIcon,
    color: '#B8A9C9',
    bgColor: 'rgba(184, 169, 201, 0.12)',
  },
  {
    id: 'beauty',
    name: 'Hair & Makeup',
    description: 'Bridal beauty services',
    icon: SparklesIcon,
    color: '#C9A96E',
    bgColor: 'rgba(201, 169, 110, 0.12)',
  },
  {
    id: 'stationery',
    name: 'Stationery',
    description: 'Invitations & paper goods',
    icon: MailIcon,
    color: '#C4A0A0',
    bgColor: 'rgba(196, 160, 160, 0.12)',
  },
  {
    id: 'transportation',
    name: 'Transportation',
    description: 'Limos, shuttles & getaway car',
    icon: CarIcon,
    color: '#8B9F82',
    bgColor: 'rgba(139, 159, 130, 0.12)',
  },
  {
    id: 'planner',
    name: 'Wedding Planner',
    description: 'Day-of coordination & planning',
    icon: UsersIcon,
    color: '#7A7A7A',
    bgColor: 'rgba(122, 122, 122, 0.12)',
  },
]

export function StepVendorCategories({ data, onChange }: StepVendorCategoriesProps) {
  function toggleCategory(id: string) {
    const isSelected = data.selectedCategories.includes(id)
    const next = isSelected
      ? data.selectedCategories.filter((c) => c !== id)
      : [...data.selectedCategories, id]
    onChange({ selectedCategories: next })
  }

  function selectAll() {
    onChange({ selectedCategories: VENDOR_CATEGORIES.map((c) => c.id) })
  }

  function clearAll() {
    onChange({ selectedCategories: [] })
  }

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(139, 159, 130, 0.15)' }}
        >
          <svg
            className="size-7"
            style={{ color: '#8B9F82' }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
        </div>
        <h2
          className="text-2xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: '#2D2D2D',
          }}
        >
          Choose your vendor categories
        </h2>
        <p
          className="mt-2 text-sm"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#7A7A7A',
          }}
        >
          Select the types of vendors you&apos;ll need. You can always change this later.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={selectAll}
          className="rounded-full px-4 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            backgroundColor: 'rgba(139, 159, 130, 0.12)',
            color: '#8B9F82',
          }}
        >
          Select all
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-full px-4 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            backgroundColor: 'rgba(122, 122, 122, 0.08)',
            color: '#7A7A7A',
          }}
        >
          Clear all
        </button>
      </div>

      {/* Category grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {VENDOR_CATEGORIES.map((category) => {
          const isSelected = data.selectedCategories.includes(category.id)
          const Icon = category.icon

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              className="group flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all hover:shadow-sm"
              style={{
                borderColor: isSelected ? category.color : '#E5E2DD',
                backgroundColor: isSelected ? category.bgColor : 'transparent',
              }}
            >
              {/* Icon */}
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors"
                style={{
                  backgroundColor: isSelected
                    ? category.color
                    : category.bgColor,
                }}
              >
                <Icon
                  className="size-5"
                  style={{
                    color: isSelected ? '#FFFFFF' : category.color,
                  }}
                />
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#2D2D2D',
                  }}
                >
                  {category.name}
                </div>
                <div
                  className="truncate text-xs"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#7A7A7A',
                  }}
                >
                  {category.description}
                </div>
              </div>

              {/* Checkbox indicator */}
              <div
                className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                style={{
                  borderColor: isSelected ? category.color : '#D1D5DB',
                  backgroundColor: isSelected ? category.color : 'transparent',
                }}
              >
                {isSelected && (
                  <svg
                    className="size-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selection count */}
      <p
        className="text-center text-sm"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          color: '#7A7A7A',
        }}
      >
        {data.selectedCategories.length === 0
          ? 'No categories selected'
          : `${data.selectedCategories.length} ${
              data.selectedCategories.length === 1 ? 'category' : 'categories'
            } selected`}
      </p>
    </div>
  )
}

'use client'

import type { VendorCategoriesData } from '@/lib/onboarding'
import { Chip, StepHeading, WhyWeAsk } from './wizard-ui'

export type { VendorCategoriesData }

interface StepVendorCategoriesProps {
  data: VendorCategoriesData
  onChange: (data: VendorCategoriesData) => void
}

const VENDOR_CATEGORIES = [
  { id: 'venue', name: 'Venue' },
  { id: 'photographer', name: 'Photographer' },
  { id: 'videographer', name: 'Videographer' },
  { id: 'caterer', name: 'Caterer' },
  { id: 'florist', name: 'Florist' },
  { id: 'music', name: 'DJ / Band' },
  { id: 'cake', name: 'Cake / Bakery' },
  { id: 'attire', name: 'Attire' },
  { id: 'beauty', name: 'Hair & Makeup' },
  { id: 'stationery', name: 'Stationery' },
  { id: 'transportation', name: 'Transportation' },
  { id: 'planner', name: 'Wedding Planner' },
]

export function StepVendorCategories({ data, onChange }: StepVendorCategoriesProps) {
  function toggleCategory(id: string) {
    const next = data.selectedCategories.includes(id)
      ? data.selectedCategories.filter((c) => c !== id)
      : [...data.selectedCategories, id]
    onChange({ selectedCategories: next })
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title="Which vendors are you still looking for?" />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Vendor categories">
        {VENDOR_CATEGORIES.map((category) => (
          <Chip
            key={category.id}
            selected={data.selectedCategories.includes(category.id)}
            onClick={() => toggleCategory(category.id)}
          >
            {category.name}
          </Chip>
        ))}
      </div>

      <WhyWeAsk>
        we keep this list on your plan, so you can see at a glance which vendors you still need.
        You can change it any time.
      </WhyWeAsk>
    </div>
  )
}

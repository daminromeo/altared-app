'use client'

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  GUEST_RANGES,
  upcomingSeasonOptions,
  type DatePrecision,
  type WeddingBasicsData,
} from '@/lib/onboarding'
import { Chip, QuestionLabel, Segmented, StepHeading, WhyWeAsk } from './wizard-ui'

interface StepWeddingDetailsProps {
  data: WeddingBasicsData
  onChange: (data: WeddingBasicsData) => void
}

const PRECISION_OPTIONS: { value: DatePrecision; label: string }[] = [
  { value: 'exact', label: 'Exact date' },
  { value: 'rough', label: 'Roughly' },
  { value: 'none', label: 'Not yet' },
]

export function StepWeddingDetails({ data, onChange }: StepWeddingDetailsProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const seasons = useMemo(() => upcomingSeasonOptions(), [])
  const selectedDate = data.weddingDate ? parseISO(data.weddingDate) : undefined

  return (
    <div className="flex flex-col gap-7">
      <StepHeading title="When's the wedding?" />

      <section className="flex flex-col gap-3" aria-label="Wedding date">
        <Segmented
          label="How sure are you of the date?"
          value={data.datePrecision}
          options={PRECISION_OPTIONS}
          onChange={(datePrecision) => onChange({ ...data, datePrecision })}
        />

        {data.datePrecision === 'exact' && (
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger className="flex min-h-12 w-full items-center justify-between rounded-xl border border-hairline bg-white px-4 text-left text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss">
              <span className={selectedDate ? 'text-ink' : 'text-ink-muted'}>
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Pick the date'}
              </span>
              <CalendarIcon className="size-4 text-ink-muted" aria-hidden />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  onChange({ ...data, weddingDate: date ? format(date, 'yyyy-MM-dd') : null })
                  setCalendarOpen(false)
                }}
                disabled={(date) => date < new Date()}
                defaultMonth={selectedDate || new Date()}
              />
            </PopoverContent>
          </Popover>
        )}

        {data.datePrecision === 'rough' && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Rough timing">
            {seasons.map((season) => (
              <Chip
                key={season.value}
                selected={data.dateEstimate === season.value}
                onClick={() => onChange({ ...data, dateEstimate: season.value })}
              >
                {season.label}
              </Chip>
            ))}
          </div>
        )}

        <WhyWeAsk>
          so deposit reminders land at the right time. A guess is fine, and you can change it
          later.
        </WhyWeAsk>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="guest-question">
        <QuestionLabel id="guest-question">About how many guests?</QuestionLabel>
        <div className="flex flex-wrap gap-2">
          {GUEST_RANGES.map((range) => (
            <Chip
              key={range.value}
              selected={data.guestRange === range.value}
              onClick={() => onChange({ ...data, guestRange: range.value })}
            >
              {range.label}
            </Chip>
          ))}
        </div>
        <WhyWeAsk>caterers and venues often price per guest.</WhyWeAsk>
      </section>
    </div>
  )
}

/** Continue is enabled once the date question has a usable answer. */
export function isWeddingDetailsAnswered(data: WeddingBasicsData): boolean {
  if (data.datePrecision === 'exact') return !!data.weddingDate
  if (data.datePrecision === 'rough') return !!data.dateEstimate
  return data.datePrecision === 'none'
}

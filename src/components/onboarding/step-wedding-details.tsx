'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, MapPinIcon, UsersIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface WeddingDetailsData {
  yourName: string
  partnerName: string
  weddingName: string
  weddingDate: Date | undefined
  location: string
  guestCount: number | ''
}

interface StepWeddingDetailsProps {
  data: WeddingDetailsData
  onChange: (data: WeddingDetailsData) => void
}

export function StepWeddingDetails({ data, onChange }: StepWeddingDetailsProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  function updateField<K extends keyof WeddingDetailsData>(
    field: K,
    value: WeddingDetailsData[K]
  ) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(196, 160, 160, 0.15)' }}
        >
          <svg
            className="size-7"
            style={{ color: '#C4A0A0' }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
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
          Tell us about your wedding
        </h2>
        <p
          className="mt-2 text-sm"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#7A7A7A',
          }}
        >
          We&apos;ll use these details to personalize your planning experience
        </p>
      </div>

      {/* Names row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="yourName"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#2D2D2D',
            }}
          >
            Your name
          </Label>
          <Input
            id="yourName"
            type="text"
            placeholder="Your first name"
            className="h-10"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              borderColor: '#E5E2DD',
            }}
            value={data.yourName}
            onChange={(e) => updateField('yourName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="partnerName"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#2D2D2D',
            }}
          >
            Partner&apos;s name
          </Label>
          <Input
            id="partnerName"
            type="text"
            placeholder="Partner's first name"
            className="h-10"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              borderColor: '#E5E2DD',
            }}
            value={data.partnerName}
            onChange={(e) => updateField('partnerName', e.target.value)}
          />
        </div>
      </div>

      {/* Wedding name */}
      <div className="space-y-2">
        <Label
          htmlFor="weddingName"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#2D2D2D',
          }}
        >
          Wedding name
        </Label>
        <Input
          id="weddingName"
          type="text"
          placeholder="e.g. The Romeo Wedding"
          className="h-10"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            borderColor: '#E5E2DD',
          }}
          value={data.weddingName}
          onChange={(e) => updateField('weddingName', e.target.value)}
        />
        <p className="text-xs" style={{ color: '#7A7A7A', fontFamily: "'DM Sans', sans-serif" }}>
          This will appear in your dashboard header
        </p>
      </div>

      {/* Wedding date */}
      <div className="space-y-2">
        <Label
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#2D2D2D',
          }}
        >
          Wedding date
        </Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            className="flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              borderColor: '#E5E2DD',
              color: data.weddingDate ? '#2D2D2D' : '#7A7A7A',
            }}
          >
            <span>
              {data.weddingDate
                ? format(data.weddingDate, 'MMMM d, yyyy')
                : 'Select your wedding date'}
            </span>
            <CalendarIcon className="size-4" style={{ color: '#7A7A7A' }} />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={data.weddingDate}
              onSelect={(date) => {
                updateField('weddingDate', date)
                setCalendarOpen(false)
              }}
              disabled={(date) => date < new Date()}
              defaultMonth={data.weddingDate || new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label
          htmlFor="location"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#2D2D2D',
          }}
        >
          <MapPinIcon className="mr-1 inline size-4" style={{ color: '#8B9F82' }} />
          Wedding location
        </Label>
        <Input
          id="location"
          type="text"
          placeholder="City, State or Venue name"
          className="h-10"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            borderColor: '#E5E2DD',
          }}
          value={data.location}
          onChange={(e) => updateField('location', e.target.value)}
        />
      </div>

      {/* Guest count */}
      <div className="space-y-2">
        <Label
          htmlFor="guestCount"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: '#2D2D2D',
          }}
        >
          <UsersIcon className="mr-1 inline size-4" style={{ color: '#8B9F82' }} />
          Estimated guest count
        </Label>
        <Input
          id="guestCount"
          type="number"
          placeholder="e.g. 150"
          min={1}
          max={2000}
          className="h-10"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            borderColor: '#E5E2DD',
          }}
          value={data.guestCount === '' ? '' : data.guestCount}
          onChange={(e) =>
            updateField(
              'guestCount',
              e.target.value === '' ? '' : parseInt(e.target.value, 10)
            )
          }
        />
      </div>
    </div>
  )
}

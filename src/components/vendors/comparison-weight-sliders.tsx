'use client';

import { RotateCcw, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { ComparisonWeights } from '@/lib/types/comparison';
import { DEFAULT_WEIGHTS } from '@/lib/types/comparison';

const WEIGHT_LABELS: Record<keyof ComparisonWeights, { label: string; description: string }> = {
  price: { label: 'Price', description: 'How much does cost matter?' },
  rating: { label: 'Rating & Reviews', description: 'Weight of ratings and reviews' },
  responsiveness: { label: 'Responsiveness', description: 'How quickly they respond and progress' },
  availability: { label: 'Availability', description: 'Confirmed availability and booking status' },
  gutFeeling: { label: 'Gut Feeling', description: 'Your personal intuition about the vendor' },
};

interface ComparisonWeightSlidersProps {
  weights: ComparisonWeights;
  onChange: (weights: ComparisonWeights) => void;
}

export function ComparisonWeightSliders({ weights, onChange }: ComparisonWeightSlidersProps) {
  const [open, setOpen] = useState(false);

  const total = Object.values(weights).reduce((sum, v) => sum + v, 0);

  function updateWeight(key: keyof ComparisonWeights, value: number) {
    onChange({ ...weights, [key]: value });
  }

  function resetWeights() {
    onChange({ ...DEFAULT_WEIGHTS });
  }

  return (
    <div className="rounded-xl border border-[#E8E4DF] bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-[#8B9F82]" />
          <span className="text-sm font-medium text-[#2D2D2D]">Priority Weights</span>
          <span className="text-xs text-[#7A7A7A]">Adjust what matters most to you</span>
        </div>
        <ChevronDown
          className={`size-4 text-[#7A7A7A] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-[#E8E4DF] px-4 py-4 space-y-4">
          {(Object.keys(WEIGHT_LABELS) as (keyof ComparisonWeights)[]).map((key) => {
            const { label, description } = WEIGHT_LABELS[key];
            const percent = total > 0 ? Math.round((weights[key] / total) * 100) : 0;

            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#2D2D2D]">{label}</span>
                    <span className="ml-2 text-xs text-[#7A7A7A]">{description}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#8B9F82] tabular-nums w-10 text-right">
                    {percent}%
                  </span>
                </div>
                <Slider
                  value={weights[key]}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(val) => updateWeight(key, val)}
                />
              </div>
            );
          })}

          <div className="flex justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={resetWeights} className="text-[#7A7A7A]">
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

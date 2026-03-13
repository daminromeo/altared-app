'use client';

import { Check, X } from 'lucide-react';
import type { VendorProCon } from '@/lib/types/comparison';

interface ProConsProps {
  data: VendorProCon;
}

export function ProsCons({ data }: ProConsProps) {
  if (data.pros.length === 0 && data.cons.length === 0) {
    return <span className="text-xs text-[#7A7A7A]">Add more data for insights</span>;
  }

  return (
    <div className="space-y-1.5 text-left max-w-[200px]">
      {data.pros.map((pro, i) => (
        <div key={`pro-${i}`} className="flex items-start gap-1.5">
          <Check className="size-3.5 text-[#047857] shrink-0 mt-0.5" />
          <span className="text-xs text-[#047857]">{pro}</span>
        </div>
      ))}
      {data.cons.map((con, i) => (
        <div key={`con-${i}`} className="flex items-start gap-1.5">
          <X className="size-3.5 text-[#DC2626] shrink-0 mt-0.5" />
          <span className="text-xs text-[#DC2626]">{con}</span>
        </div>
      ))}
    </div>
  );
}

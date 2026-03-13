'use client';

import { Badge } from '@/components/ui/badge';

type VendorStatus =
  | 'researching'
  | 'contacted'
  | 'quoted'
  | 'meeting_scheduled'
  | 'negotiating'
  | 'booked'
  | 'declined'
  | 'archived';

const statusConfig: Record<
  VendorStatus,
  { label: string; bg: string; text: string }
> = {
  researching: {
    label: 'Researching',
    bg: 'bg-[#E5E7EB]',
    text: 'text-[#4B5563]',
  },
  contacted: {
    label: 'Contacted',
    bg: 'bg-[#DBEAFE]',
    text: 'text-[#1D4ED8]',
  },
  quoted: {
    label: 'Quoted',
    bg: 'bg-[#EDE9FE]',
    text: 'text-[#7C3AED]',
  },
  meeting_scheduled: {
    label: 'Meeting Scheduled',
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#D97706]',
  },
  negotiating: {
    label: 'Negotiating',
    bg: 'bg-[#FEF9C3]',
    text: 'text-[#A16207]',
  },
  booked: {
    label: 'Booked',
    bg: 'bg-[#D1FAE5]',
    text: 'text-[#047857]',
  },
  declined: {
    label: 'Declined',
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#DC2626]',
  },
  archived: {
    label: 'Archived',
    bg: 'bg-[#F3F4F6]',
    text: 'text-[#6B7280]',
  },
};

interface VendorStatusBadgeProps {
  status: VendorStatus;
  className?: string;
}

export function VendorStatusBadge({ status, className }: VendorStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} border-transparent font-medium ${className ?? ''}`}
    >
      {config.label}
    </Badge>
  );
}

export { statusConfig };
export type { VendorStatus };

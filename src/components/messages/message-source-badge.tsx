import { cn } from "@/lib/utils";
import { Mail, Phone, MessageSquare, Instagram, Users, Pencil } from "lucide-react";

type MessageSource = "email" | "phone" | "text" | "instagram" | "in_person" | "the_knot" | "wedding_wire" | "other";

interface MessageSourceBadgeProps {
  source: MessageSource;
  className?: string;
}

const sourceConfig: Record<
  MessageSource,
  { label: string; icon: typeof Mail; bg: string; text: string }
> = {
  email: {
    label: "Email",
    icon: Mail,
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  phone: {
    label: "Phone",
    icon: Phone,
    bg: "bg-green-100",
    text: "text-green-700",
  },
  text: {
    label: "Text",
    icon: MessageSquare,
    bg: "bg-purple-100",
    text: "text-purple-700",
  },
  instagram: {
    label: "Instagram",
    icon: Instagram,
    bg: "bg-pink-100",
    text: "text-pink-700",
  },
  in_person: {
    label: "In Person",
    icon: Users,
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
  the_knot: {
    label: "The Knot",
    icon: Mail,
    bg: "bg-rose-100",
    text: "text-rose-700",
  },
  wedding_wire: {
    label: "WeddingWire",
    icon: Mail,
    bg: "bg-teal-100",
    text: "text-teal-700",
  },
  other: {
    label: "Other",
    icon: Pencil,
    bg: "bg-gray-100",
    text: "text-gray-600",
  },
};

export function MessageSourceBadge({
  source,
  className,
}: MessageSourceBadgeProps) {
  const config = sourceConfig[source] ?? sourceConfig.other;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight",
        config.bg,
        config.text,
        className
      )}
    >
      <Icon className="size-3 shrink-0" />
      {config.label}
    </span>
  );
}

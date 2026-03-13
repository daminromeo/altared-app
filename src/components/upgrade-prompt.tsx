'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCheckout } from '@/lib/hooks/use-subscription';
import { PLANS } from '@/lib/stripe/config';

interface UpgradePromptProps {
  title: string;
  description: string;
  plan?: 'pro' | 'premium';
  compact?: boolean;
}

export function UpgradePrompt({
  title,
  description,
  plan = 'pro',
  compact = false,
}: UpgradePromptProps) {
  const checkout = useCheckout();
  const targetPlan = PLANS[plan];

  function handleUpgrade() {
    if (targetPlan.stripePriceIdMonthly) {
      checkout.mutate({ priceId: targetPlan.stripePriceIdMonthly });
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[#C9A96E]/30 bg-[#C9A96E]/5 px-3 py-2">
        <Lock className="size-3.5 text-[#C9A96E] shrink-0" />
        <span className="text-xs text-[#C9A96E] font-medium">{title}</span>
        <Button
          onClick={handleUpgrade}
          disabled={checkout.isPending}
          className="ml-auto h-6 px-2 text-xs bg-[#C9A96E] hover:bg-[#B8985D] text-white"
        >
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-[#C9A96E]/30 bg-[#C9A96E]/5 p-6 text-center">
      <div className="rounded-full bg-[#C9A96E]/10 p-3">
        <Lock className="size-5 text-[#C9A96E]" />
      </div>
      <div>
        <p className="font-semibold text-[#2D2D2D]">{title}</p>
        <p className="mt-1 text-sm text-[#7A7A7A]">{description}</p>
      </div>
      <Button
        onClick={handleUpgrade}
        disabled={checkout.isPending}
        className="bg-[#C9A96E] hover:bg-[#B8985D] text-white"
      >
        {checkout.isPending ? 'Loading...' : `Upgrade to ${targetPlan.name}`}
      </Button>
    </div>
  );
}

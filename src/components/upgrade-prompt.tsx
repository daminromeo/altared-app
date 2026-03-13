'use client';

import { useState } from 'react';
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
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  function handleUpgrade() {
    const priceId = billingPeriod === 'yearly'
      ? targetPlan.stripePriceIdYearly
      : targetPlan.stripePriceIdMonthly;
    if (priceId) {
      checkout.mutate({ priceId });
    }
  }

  const price = billingPeriod === 'yearly' ? targetPlan.priceYearly : targetPlan.priceMonthly;
  const period = billingPeriod === 'yearly' ? 'year' : 'month';

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
      {/* Billing period toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-white/60 p-1">
        <button
          type="button"
          onClick={() => setBillingPeriod('monthly')}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
            billingPeriod === 'monthly'
              ? 'bg-white text-[#2D2D2D] shadow-sm'
              : 'text-[#7A7A7A] hover:text-[#2D2D2D]'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBillingPeriod('yearly')}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
            billingPeriod === 'yearly'
              ? 'bg-white text-[#2D2D2D] shadow-sm'
              : 'text-[#7A7A7A] hover:text-[#2D2D2D]'
          }`}
        >
          Yearly
          <span className="ml-1 text-[10px] text-[#8B9F82]">Save ~17%</span>
        </button>
      </div>
      <Button
        onClick={handleUpgrade}
        disabled={checkout.isPending}
        className="bg-[#C9A96E] hover:bg-[#B8985D] text-white"
      >
        {checkout.isPending ? 'Loading...' : `Upgrade to ${targetPlan.name} — $${price}/${period}`}
      </Button>
    </div>
  );
}

'use client'

import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCheckout } from '@/lib/hooks/use-subscription'
import { PLANS } from '@/lib/stripe/config'

export function DashboardUpgradeCard() {
  const checkout = useCheckout()
  const proPlan = PLANS.pro

  function handleUpgrade() {
    if (proPlan.stripePriceIdMonthly) {
      checkout.mutate({ priceId: proPlan.stripePriceIdMonthly })
    }
  }

  return (
    <Card className="border-[#C9A96E]/30 bg-gradient-to-br from-[#C9A96E]/5 to-[#C9A96E]/10">
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#C9A96E]/15">
            <Sparkles className="size-5 text-[#C9A96E]" />
          </div>
          <div className="min-w-0 flex-1 sm:flex-initial">
            <p className="text-sm font-semibold text-[#2D2D2D]">
              Unlock more with Pro
            </p>
            <p className="text-xs text-[#7A7A7A]">
              Compare up to 4 vendors, AI scoring, collaborative sharing, and more for ${proPlan.priceMonthly}/mo.
            </p>
          </div>
        </div>
        <Button
          onClick={handleUpgrade}
          disabled={checkout.isPending}
          className="w-full sm:w-auto shrink-0 bg-[#C9A96E] text-white hover:bg-[#B8985D]"
          size="sm"
        >
          {checkout.isPending ? 'Loading...' : 'Upgrade'}
        </Button>
      </CardContent>
    </Card>
  )
}

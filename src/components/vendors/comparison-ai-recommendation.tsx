'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpgradePrompt } from '@/components/upgrade-prompt';
import type { ComparisonWeights, AIRecommendation } from '@/lib/types/comparison';
import { toast } from 'sonner';

interface AIRecommendationPanelProps {
  vendorIds: string[];
  weights: ComparisonWeights;
  isPremiumUser: boolean;
  vendorNames: Record<string, string>;
}

export function AIRecommendationPanel({
  vendorIds,
  weights,
  isPremiumUser,
  vendorNames,
}: AIRecommendationPanelProps) {
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchRecommendation() {
    if (vendorIds.length < 2) {
      toast.error('Select at least 2 vendors for a recommendation');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/vendors/compare/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorIds, weights }),
      });

      if (res.status === 403) {
        toast.error('Upgrade to Pro to unlock AI recommendations');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to get recommendation');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setRecommendation(data.recommendation);
    } catch {
      toast.error('Failed to get AI recommendation');
    } finally {
      setLoading(false);
    }
  }

  if (!isPremiumUser) {
    return (
      <UpgradePrompt
        title="AI-Powered Recommendations"
        description="Get personalized vendor recommendations based on your priorities, pricing, and ratings."
        compact
      />
    );
  }

  return (
    <div className="rounded-xl border border-[#8B9F82]/20 bg-[#8B9F82]/5 p-4">
      {recommendation ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#8B9F82]" />
            <span className="text-sm font-semibold text-[#2D2D2D]">AI Recommendation</span>
            {recommendation.topPickId && vendorNames[recommendation.topPickId] && (
              <span className="inline-flex items-center rounded-full bg-[#047857]/10 px-2 py-0.5 text-xs font-medium text-[#047857]">
                Top Pick: {vendorNames[recommendation.topPickId]}
              </span>
            )}
          </div>
          <p className="text-sm text-[#2D2D2D] leading-relaxed">{recommendation.summary}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRecommendation}
            disabled={loading}
            className="text-[#7A7A7A]"
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                Refresh
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#8B9F82]" />
            <div>
              <span className="text-sm font-medium text-[#2D2D2D]">AI Recommendation</span>
              <p className="text-xs text-[#7A7A7A]">
                Get a personalized recommendation based on your priorities
              </p>
            </div>
          </div>
          <Button
            onClick={fetchRecommendation}
            disabled={loading || vendorIds.length < 2}
            className="bg-[#8B9F82] hover:bg-[#7A8E71] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                Get Recommendation
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

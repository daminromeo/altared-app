'use client';

import { Lock } from 'lucide-react';
import { useCheckout, useSubscription } from '@/lib/hooks/use-subscription';
import { PLANS } from '@/lib/stripe/config';

interface UpgradePromptProps {
  title: string;
  description: string;
  compact?: boolean;
  /** Analytics label for where this prompt sits, e.g. "compare_scoring" */
  location?: string;
}

/**
 * Shown where a Free user reaches a Wedding Pass feature. Says what the
 * feature does and offers the pass at its one-time price.
 */
export function UpgradePrompt({ title, description, compact = false, location }: UpgradePromptProps) {
  const checkout = useCheckout();
  const { trialEnded } = useSubscription();
  const price = `$${PLANS.pass.price}`;
  const where = location ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  function handleUpgrade() {
    checkout.mutate({ location: where });
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-moss/15 bg-sage-soft px-3 py-2">
        <Lock className="size-3.5 shrink-0 text-moss" aria-hidden />
        <span className="text-xs font-medium text-moss">{title} comes with the Wedding Pass</span>
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={checkout.isPending}
          className="ml-auto shrink-0 rounded-full bg-moss px-3 py-1 text-xs font-semibold text-white hover:bg-moss-light disabled:opacity-60"
        >
          {checkout.isPending ? 'Opening…' : `Get it · ${price}`}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-moss/15 bg-sage-soft p-6 text-center">
      <div className="rounded-full bg-white p-3">
        <Lock className="size-5 text-moss" aria-hidden />
      </div>
      <div>
        <p className="font-display text-lg font-bold tracking-[-0.02em] text-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{description}</p>
        {trialEnded && (
          <p className="mt-2 text-sm text-ink-muted">
            Your free trial has ended. Everything you added is still here.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={checkout.isPending}
        className="rounded-full bg-moss px-5 py-2.5 font-display text-sm font-bold text-white hover:bg-moss-light disabled:opacity-60"
      >
        {checkout.isPending ? 'Opening checkout…' : `Get the Wedding Pass · ${price}`}
      </button>
      <p className="text-xs text-ink-muted">One payment. Use it through your wedding.</p>
      {checkout.isError && (
        <p role="alert" className="text-xs text-error">
          Checkout didn&apos;t open: {checkout.error.message}. Try again in a moment.
        </p>
      )}
    </div>
  );
}

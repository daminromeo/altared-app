'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConnectPhoneEmbed, PhoneConnected } from '@/components/texting/connect-phone'
import { useTextConnection } from '@/lib/hooks/use-text-connection'
import { trackEvent } from '@/lib/analytics'

/**
 * Top of the dashboard until a phone is connected: the planner is the thing
 * no spreadsheet does, so it shouldn't wait in Settings.
 */
export function TextPlannerPrompt() {
  const [open, setOpen] = useState(false)
  const { connected } = useTextConnection({ watch: open })
  const reported = useRef(false)

  useEffect(() => {
    if (connected && open && !reported.current) {
      reported.current = true
      trackEvent('texting_connected', { location: 'dashboard' })
    }
  }, [connected, open])

  // Once connected the card goes away, but an open dialog stays up to show it worked
  if (connected === null || (connected && !open)) return null

  function openDialog() {
    setOpen(true)
    trackEvent('texting_connect_viewed', { location: 'dashboard' })
  }

  return (
    <>
      <section className="flex flex-col gap-4 rounded-3xl bg-moss p-5 text-[#F1EFE8] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 flex-none items-center justify-center rounded-2xl bg-[#0A84FF] text-white">
            <MessageCircle className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold tracking-[-0.02em]">Text your planner</h2>
            <p className="mt-0.5 max-w-[52ch] text-sm leading-relaxed text-[#C9D3C6]">
              Text a photo of a quote, a payment you made, or a question about your budget, and your plan
              updates itself. Works with iMessage and Android texting.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openDialog}
          className="inline-flex h-11 flex-none items-center justify-center rounded-full bg-champagne px-5 font-display text-sm font-bold text-ink transition-opacity hover:opacity-90"
        >
          Connect your phone
        </button>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Text your planner</DialogTitle>
            <DialogDescription>
              Scan the code with your phone, or tap it on mobile, and send the text that opens.
            </DialogDescription>
          </DialogHeader>
          {connected ? <PhoneConnected /> : <ConnectPhoneEmbed className="mx-auto" />}
        </DialogContent>
      </Dialog>
    </>
  )
}

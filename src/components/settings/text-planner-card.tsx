"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConnectPhoneEmbed, PhoneConnected, TextExamples } from "@/components/texting/connect-phone";
import { useTextConnection } from "@/lib/hooks/use-text-connection";

/** Settings → Texting: connect a phone, or see that one is connected. */
export function TextPlannerCard() {
  const { connected } = useTextConnection({ watch: true });

  return (
    <Card className="border-hairline">
      <CardHeader>
        <CardTitle className="text-ink">Text your planner</CardTitle>
        <CardDescription className="text-ink-muted">
          {connected
            ? "Text your planner anytime to update tasks, budget and vendors. To connect a different phone, scan a new code from it."
            : "Scan the code with your phone (or tap it on mobile) and send the text that opens. After that, text your planner anytime to update tasks, budget and vendors."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex w-full max-w-[360px] shrink-0 flex-col gap-4">
          {connected && <PhoneConnected />}
          <ConnectPhoneEmbed />
        </div>
        <div className="space-y-3">
          <TextExamples />
          <p className="text-sm text-ink-muted">
            Anything you add by text shows up here in your dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

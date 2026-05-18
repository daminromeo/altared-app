type SlackBlock = Record<string, unknown>

type SlackPayload = {
  text: string
  blocks?: SlackBlock[]
}

async function postToSlack(payload: SlackPayload): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error(
        "Slack webhook returned non-OK status:",
        res.status,
        await res.text().catch(() => "")
      )
    }
  } catch (err) {
    console.error("Slack webhook failed:", err)
  }
}

function planLabel(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

export async function notifyNewSignup(params: {
  email?: string | null
  name?: string | null
  provider?: string | null
}): Promise<void> {
  const { email, name, provider } = params
  const who = name ? `${name} (${email ?? "no email"})` : (email ?? "unknown user")
  const via = provider ? ` via ${provider}` : ""
  await postToSlack({
    text: `:wave: New signup: ${who}${via}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:wave: *New signup*${via}\n*${name ?? "—"}*  •  ${email ?? "—"}`,
        },
      },
    ],
  })
}

export async function notifyNewSubscription(params: {
  email?: string | null
  plan: string
  amount?: number | null
  currency?: string | null
}): Promise<void> {
  const { email, plan, amount, currency } = params
  const price =
    typeof amount === "number"
      ? ` — ${(currency ?? "USD").toUpperCase()} ${amount.toFixed(2)}`
      : ""
  await postToSlack({
    text: `:moneybag: New ${planLabel(plan)} subscription: ${email ?? "unknown"}${price}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:moneybag: *New subscription* — *${planLabel(plan)}*${price}\n${email ?? "—"}`,
        },
      },
    ],
  })
}

export async function notifySubscriptionUpdated(params: {
  email?: string | null
  plan: string
  status: string
}): Promise<void> {
  const { email, plan, status } = params
  await postToSlack({
    text: `:arrows_counterclockwise: Subscription updated: ${email ?? "unknown"} → ${planLabel(plan)} (${status})`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:arrows_counterclockwise: *Subscription updated*\n${email ?? "—"} → *${planLabel(plan)}* (\`${status}\`)`,
        },
      },
    ],
  })
}

export async function notifySubscriptionCanceled(params: {
  email?: string | null
}): Promise<void> {
  const { email } = params
  await postToSlack({
    text: `:x: Subscription canceled: ${email ?? "unknown"}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:x: *Subscription canceled*\n${email ?? "—"}`,
        },
      },
    ],
  })
}

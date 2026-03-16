const TIKTOK_PIXEL_ID = "D6S5E63C77U6E9GS3SUG";
const TIKTOK_API_URL =
  "https://business-api.tiktok.com/open_api/v1.2/pixel/track/";

interface TikTokEventParams {
  event: string;
  email?: string;
  /** Value in USD for purchase events */
  value?: number;
  currency?: string;
  contentId?: string;
  contentName?: string;
}

/**
 * Send a server-side event to TikTok Conversion API.
 * Fires and forgets — errors are logged but never thrown.
 */
export async function trackTikTokEvent({
  event,
  email,
  value,
  currency = "USD",
  contentId,
  contentName,
}: TikTokEventParams) {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("TIKTOK_ACCESS_TOKEN not set — skipping TikTok event:", event);
    return;
  }

  const context: Record<string, unknown> = {};
  if (email) {
    context.user = { email };
  }

  const properties: Record<string, unknown> = {};
  if (value !== undefined) {
    properties.value = value;
    properties.currency = currency;
  }
  if (contentId) properties.content_id = contentId;
  if (contentName) properties.content_name = contentName;

  const payload = {
    pixel_code: TIKTOK_PIXEL_ID,
    event,
    timestamp: new Date().toISOString(),
    context,
    properties,
  };

  try {
    const res = await fetch(TIKTOK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("TikTok CAPI error:", res.status, text);
    }
  } catch (err) {
    console.error("TikTok CAPI request failed:", err);
  }
}

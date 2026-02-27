import { PostHog } from "posthog-node"

let posthogClient: PostHog | null = null

function getPostHogClient(): PostHog | null {
  if (!process.env.POSTHOG_API_KEY) return null

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    })
  }

  return posthogClient
}

export function trackEvent({
  userId,
  event,
  properties,
}: {
  userId: string
  event: string
  properties?: Record<string, unknown>
}) {
  const client = getPostHogClient()
  if (!client) return

  client.capture({
    distinctId: userId,
    event,
    properties,
  })
}

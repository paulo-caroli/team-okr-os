"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createInitiative } from "@/lib/actions/initiative-actions"
import type { SupportingSignal } from "@/lib/domain/commitment"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface InitiativeFormProps {
  commitmentId: string
  teamId: string
  signals: SupportingSignal[]
  onSuccess?: (initiative?: { id: string; name: string; hypothesis: string; expectedImpact: unknown; status: string; conclusionReason: string | null; conclusionImpact: string | null }) => void
  variant?: "card" | "plain"
}

export function InitiativeForm({
  commitmentId,
  teamId,
  signals,
  onSuccess,
  variant = "card",
}: InitiativeFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createInitiative, null)
  const [impactPrimary, setImpactPrimary] = useState(false)
  const [impactSignalIds, setImpactSignalIds] = useState<string[]>([])

  useEffect(() => {
    if (state && "success" in state && state.success) {
      router.refresh()
      try {
        onSuccess?.(state.initiative ?? undefined)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error("[InitiativeForm] onSuccess error", { error: message })
      }
    }
  }, [state, onSuccess, router])

  function toggleSignal(signalId: string) {
    setImpactSignalIds((prev) =>
      prev.includes(signalId)
        ? prev.filter((id) => id !== signalId)
        : [...prev, signalId]
    )
  }

  const content = (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="commitmentId" value={commitmentId} />
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="impactPrimary" value={impactPrimary ? "true" : "false"} />
      <input type="hidden" name="impactSignalIds" value={impactSignalIds.join(",")} />

      {state && "error" in state && state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      <Input
        name="name"
        label="Initiative"
        placeholder="e.g., Simplify onboarding flow"
        required
      />

      <Textarea
        name="hypothesis"
        label="Why do we believe this will influence the Primary Outcome?"
        placeholder="Explain the reasoning behind this initiative..."
        hint="Focus on why it should influence the Primary Outcome."
        required
        rows={3}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Expected to influence
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Which outcomes or signals should move if we&apos;re right?
        </p>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={impactPrimary}
              onChange={(e) => setImpactPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Primary Outcome
            </span>
          </label>

          {signals.map((signal) => (
            <label key={signal.id} className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={impactSignalIds.includes(signal.id)}
                onChange={() => toggleSignal(signal.id)}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {signal.statement || signal.metric}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={isPending}>
          Add initiative
        </Button>
      </div>
    </form>
  )

  if (variant === "plain") return content
  return <Card>{content}</Card>
}

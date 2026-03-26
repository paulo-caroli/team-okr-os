"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createInitiative, updateInitiative } from "@/lib/actions/initiative-actions"
import type { KeyResult } from "@/lib/domain/commitment"
import type { InitiativeView } from "@/lib/domain/initiative"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface InitiativeFormProps {
  commitmentId: string
  teamId: string
  keyResults: KeyResult[]
  initiative?: InitiativeView
  onSuccess?: (initiative?: {
    id: string
    name: string
    hypothesis: string
    expectedImpact: unknown
    status: string
    conclusionReason: string | null
    conclusionImpact: string | null
  }) => void
  onCancel?: () => void
  variant?: "card" | "plain"
  defaultImpactKeyResultIds?: string[]
}

export function InitiativeForm({
  commitmentId,
  teamId,
  keyResults,
  initiative,
  onSuccess,
  onCancel,
  variant = "card",
  defaultImpactKeyResultIds,
}: InitiativeFormProps) {
  const isEdit = !!initiative
  const router = useRouter()
  const action = isEdit ? updateInitiative : createInitiative
  const [state, formAction, isPending] = useActionState(action, null)
  const [impactKeyResultIds, setImpactKeyResultIds] = useState<string[]>(
    initiative?.expectedImpact?.keyResultIds ?? defaultImpactKeyResultIds ?? [],
  )

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

  function toggleKeyResult(id: string) {
    setImpactKeyResultIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const content = (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="commitmentId" value={commitmentId} />
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="impactKeyResultIds" value={impactKeyResultIds.join(",")} />
      {isEdit && <input type="hidden" name="initiativeId" value={initiative.id} />}

      {state && "error" in state && state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      <Input
        name="name"
        label="Initiative"
        placeholder="e.g., Simplify onboarding flow"
        defaultValue={initiative?.name ?? ""}
        required
      />

      <Textarea
        name="hypothesis"
        label="Why do we believe this will influence the team objectives?"
        placeholder="Explain the reasoning behind this initiative..."
        hint="Focus on how this should move measurable key results."
        defaultValue={initiative?.hypothesis ?? ""}
        required
        rows={3}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Expected to influence</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Which key results should move if we&apos;re right?
        </p>

        {keyResults.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Add key results to your objectives before linking initiatives.
          </p>
        ) : (
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {keyResults.map((kr) => (
              <label key={kr.id} className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={impactKeyResultIds.includes(kr.id)}
                  onChange={() => toggleKeyResult(kr.id)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {kr.title} — <span className="text-zinc-400">{kr.metric}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={isPending}>
          {isEdit ? "Save changes" : "Add initiative"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )

  if (variant === "plain") return content
  return <Card>{content}</Card>
}

"use client"

import { useActionState, useState } from "react"
import { createCommitment } from "@/lib/actions/commitment-actions"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SectionHeader } from "@/components/ui/section-header"
import type { CommitmentPrefill } from "@/app/(app)/team/[teamId]/commitment/new/page"

const STRATEGIC_CONTEXT_PLACEHOLDER = "e.g. Premium category revenue must grow 40% this year."

interface CommitmentCreationFormProps {
  teamId: string
  prefill?: CommitmentPrefill | null
}

export function CommitmentCreationForm({ teamId, prefill }: CommitmentCreationFormProps) {
  const [state, formAction, isPending] = useActionState(createCommitment, null)

  const prefillSignalCount = prefill?.signals.length ?? 0
  const [signalCount, setSignalCount] = useState(prefillSignalCount)

  const [primaryCurrent, setPrimaryCurrent] = useState(
    prefill ? String(prefill.primaryCurrent) : ""
  )
  const [primaryCurrentTouched, setPrimaryCurrentTouched] = useState(!!prefill)

  const [signalCurrents, setSignalCurrents] = useState<Record<number, string>>(() => {
    if (!prefill) return {}
    const init: Record<number, string> = {}
    prefill.signals.forEach((s, i) => {
      init[i] = String(s.current)
    })
    return init
  })
  const [signalCurrentsTouched, setSignalCurrentsTouched] = useState<Record<number, boolean>>(() => {
    if (!prefill) return {}
    const init: Record<number, boolean> = {}
    prefill.signals.forEach((_, i) => {
      init[i] = true
    })
    return init
  })

  const [copyInitiatives, setCopyInitiatives] = useState(false)

  function handlePrimaryBaselineBlur(e: React.FocusEvent<HTMLInputElement>) {
    const baseline = e.target.value.trim()
    if (baseline && !primaryCurrentTouched && !primaryCurrent) {
      setPrimaryCurrent(baseline)
    }
  }

  function handleSignalBaselineBlur(index: number, e: React.FocusEvent<HTMLInputElement>) {
    const baseline = e.target.value.trim()
    if (baseline && !signalCurrentsTouched[index] && !signalCurrents[index]) {
      setSignalCurrents((prev) => ({ ...prev, [index]: baseline }))
    }
  }

  return (
    <form action={formAction} className="space-y-10">
      <input type="hidden" name="teamId" value={teamId} />

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      {/* Clone banner */}
      {prefill && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-800/50 dark:bg-blue-900/10">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            You are creating a new commitment based on a previous one.
          </p>
          <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
            Previous cycle ended with current value: {prefill.previousCurrentValue}
          </p>
        </div>
      )}

      {/* Strategic Context */}
      <div>
        <SectionHeader
          title="Strategic Context"
          description="Why does this commitment exist now?"
          className="mb-4"
        />
        <Card>
          <Textarea
            name="strategicIntent"
            placeholder={STRATEGIC_CONTEXT_PLACEHOLDER}
            hint="Describe the broader strategic priority or challenge this commitment supports."
            required
            rows={3}
            defaultValue={prefill?.strategicIntent}
          />
        </Card>
      </div>

      {/* Primary Outcome — visually dominant */}
      <div className="mt-14">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Primary Outcome
          </h2>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            The one measurable result your team commits to move, within a time-bounded cycle.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-300 p-6 dark:border-zinc-600">
          <div className="space-y-4">
            <Textarea
              name="primaryOutcomeStatement"
              label="Outcome Statement"
              placeholder="e.g. Increase premium checkout conversion rate from 5% to 12% by Q1."
              hint="Describe the result your team commits to move in this cycle. Keep it clear and directional."
              rows={2}
              defaultValue={prefill?.primaryOutcomeStatement ?? undefined}
            />
            <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <Input
                name="primaryMetric"
                label="Metric Name"
                placeholder="e.g. Premium checkout conversion rate (%)"
                hint="The specific metric that proves this outcome is improving."
                required
                defaultValue={prefill?.primaryMetric}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                name="primaryBaseline"
                type="number"
                step="any"
                label="Baseline (optional)"
                placeholder="e.g. 5"
                onBlur={handlePrimaryBaselineBlur}
                defaultValue={prefill?.primaryBaseline != null ? String(prefill.primaryBaseline) : undefined}
              />
              <Input
                name="primaryTarget"
                type="number"
                step="any"
                label="Target"
                placeholder="e.g. 12"
                required
              />
              <Input
                name="primaryCurrent"
                type="number"
                step="any"
                label="Current value"
                placeholder="e.g. 5"
                required
                value={primaryCurrent}
                onChange={(e) => {
                  setPrimaryCurrent(e.target.value)
                  setPrimaryCurrentTouched(true)
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cycle */}
      <div>
        <SectionHeader
          title="Cycle"
          description="The time boundary for this commitment"
          className="mb-4"
        />
        <Card>
          <Input
            name="cycleLabel"
            label="Cycle label (optional)"
            placeholder="e.g., Q1 2026, Sprint 4, 6-Week Cycle"
          />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input
              name="cycleStartDate"
              type="date"
              label="Start date"
              required
            />
            <Input
              name="cycleEndDate"
              type="date"
              label="End date"
              required
            />
          </div>
        </Card>
      </div>

      {/* Supporting Signals */}
      <div className="mt-14 border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <SectionHeader
          title="Progress Indicators"
          description="Measurable signals of progress toward the Primary Outcome."
          className="mb-4"
          action={
            signalCount < 5 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSignalCount((c) => Math.min(c + 1, 5))}
              >
                + Add indicator
              </Button>
            ) : null
          }
        />
        <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
          These must reflect measurable progress toward the Primary Outcome — not activities or deliverables.
        </p>
        {signalCount > 0 && (
          <div className="space-y-3">
            {Array.from({ length: signalCount }).map((_, i) => {
              const prefillSignal = prefill?.signals[i]
              return (
                <Card key={i} className="space-y-3 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">
                      Indicator {i + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSignalCount((c) => c - 1)}
                    >
                      Remove
                    </Button>
                  </div>
                  <Textarea
                    name={`signal_${i}_statement`}
                    label="Indicator Statement"
                    placeholder="e.g. Reduce checkout drop-off between shipping and payment."
                    hint="Describe the measurable change that indicates progress toward the Primary Outcome."
                    rows={2}
                    defaultValue={prefillSignal?.statement ?? undefined}
                  />
                  <Input
                    name={`signal_${i}_metric`}
                    label="Metric Name"
                    placeholder="e.g. Checkout step drop-off rate (%)"
                    hint="The measurable indicator that proves this signal is improving."
                    required
                    defaultValue={prefillSignal?.metric}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      name={`signal_${i}_baseline`}
                      type="number"
                      step="any"
                      label="Baseline (optional)"
                      placeholder="e.g. 45"
                      onBlur={(e) => handleSignalBaselineBlur(i, e)}
                      defaultValue={prefillSignal?.baseline != null ? String(prefillSignal.baseline) : undefined}
                    />
                    <Input
                      name={`signal_${i}_target`}
                      type="number"
                      step="any"
                      label="Target"
                      placeholder="e.g. 30"
                      required
                    />
                    <Input
                      name={`signal_${i}_current`}
                      type="number"
                      step="any"
                      label="Current value"
                      placeholder="e.g. 45"
                      required
                      value={signalCurrents[i] ?? ""}
                      onChange={(e) => {
                        setSignalCurrents((prev) => ({ ...prev, [i]: e.target.value }))
                        setSignalCurrentsTouched((prev) => ({ ...prev, [i]: true }))
                      }}
                    />
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Copy previous initiatives */}
      {prefill && prefill.initiatives.length > 0 && (
        <div>
          <SectionHeader
            title="Previous Initiatives"
            description={`${prefill.initiatives.length} initiative${prefill.initiatives.length > 1 ? "s" : ""} from the previous commitment`}
            className="mb-4"
          />
          <Card className="space-y-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="copyInitiatives"
                value="true"
                checked={copyInitiatives}
                onChange={(e) => setCopyInitiatives(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Copy previous initiatives into this new commitment
                </span>
                <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-500">
                  Initiative names and hypotheses will be copied. Status will be reset to Active.
                </span>
              </div>
            </label>

            {copyInitiatives && (
              <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                {prefill.initiatives.map((init, i) => (
                  <div key={i} className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {init.name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      {init.hypothesis}
                    </p>
                    <input type="hidden" name={`initiative_${i}_name`} value={init.name} />
                    <input type="hidden" name={`initiative_${i}_hypothesis`} value={init.hypothesis} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Submit */}
      <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" loading={isPending}>
            Create commitment
          </Button>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This creates an explicit team commitment to a measurable outcome.
          </p>
        </div>
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          This will activate the commitment immediately. The Primary Outcome cannot be edited after activation.
        </p>
      </div>
    </form>
  )
}

"use client"

import { useState, useTransition } from "react"
import type { PrimaryOutcome, Cycle, SupportingSignal } from "@/lib/domain/commitment"
import { updatePrimaryCurrent } from "@/lib/actions/commitment-actions"
import { SupportingSignalList } from "./supporting-signal-list"
import { Card } from "@/components/ui/card"
import { SectionHeader } from "@/components/ui/section-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDate, daysRemaining, cycleProgress } from "@/lib/utils"

interface PrimaryOutcomeSectionProps {
  outcome: PrimaryOutcome
  cycle: Cycle
  commitmentId: string
  signals: SupportingSignal[]
}

function formatNumber(value: number): string {
  return String(value)
}

export function PrimaryOutcomeSection({
  outcome,
  cycle,
  commitmentId,
  signals,
}: PrimaryOutcomeSectionProps) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const progress = cycleProgress(cycle.startDate, cycle.endDate)
  const remaining = daysRemaining(cycle.endDate)

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updatePrimaryCurrent(null, formData)
      setEditing(false)
    })
  }

  return (
    <div>
      <SectionHeader
        title="Primary Outcome"
        description="The one metric this team commits to move"
        className="mb-3"
      />
      <Card>
        {/* Outcome statement */}
        {outcome.outcomeStatement && (
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {outcome.outcomeStatement}
          </p>
        )}

        {/* Metric name */}
        <div className={outcome.outcomeStatement ? "mt-2" : ""}>
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Metric
          </span>
          <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
            {outcome.metric}
          </p>
        </div>

        {/* Baseline · Target · Current */}
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          {outcome.baseline !== null && (
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Baseline</span>
              <p className="mt-0.5 font-medium text-zinc-700 dark:text-zinc-300">
                {outcome.baseline}
              </p>
            </div>
          )}
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Target</span>
            <p className="mt-0.5 font-medium text-zinc-700 dark:text-zinc-300">
              {outcome.target}
            </p>
          </div>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Current</span>
            {editing ? (
              <form action={handleSubmit} className="mt-1 flex items-center gap-2">
                <input type="hidden" name="commitmentId" value={commitmentId} />
                <Input
                  name="currentValue"
                  type="number"
                  step="any"
                  defaultValue={formatNumber(outcome.current)}
                  placeholder="e.g., 68"
                  className="h-8 w-32"
                  required
                  autoFocus
                />
                <Button size="sm" type="submit" loading={isPending}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <p
                className="mt-0.5 cursor-pointer font-medium text-zinc-900 underline decoration-dashed underline-offset-4 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                onClick={() => setEditing(true)}
              >
                {outcome.current}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-5 border-t border-zinc-150 dark:border-zinc-800" />

        {/* Cycle */}
        <div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Cycle
              </span>
              {cycle.label && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {cycle.label}
                  </span>
                </>
              )}
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}
              </span>
            </div>
            <span className="text-zinc-500 dark:text-zinc-400">
              {remaining > 0 ? `${remaining} days remaining` : "Cycle ended"}
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-zinc-400 dark:text-zinc-500">
            {progress}% elapsed
          </div>
        </div>

        {signals.length > 0 && (
          <>
            <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800" />
            <SupportingSignalList signals={signals} />
          </>
        )}
      </Card>
    </div>
  )
}

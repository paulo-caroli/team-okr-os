"use client"

import type { Cycle } from "@/lib/domain/commitment"
import { Card } from "@/components/ui/card"
import { formatDate, daysRemaining, cycleProgress } from "@/lib/utils"

interface CycleSectionProps {
  cycle: Cycle
}

export function CycleSection({ cycle }: CycleSectionProps) {
  const progress = cycleProgress(cycle.startDate, cycle.endDate)
  const remaining = daysRemaining(cycle.endDate)

  return (
    <Card>
      <div className="flex items-center justify-between text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Cycle
          </span>
          {cycle.label && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{cycle.label}</span>
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
    </Card>
  )
}

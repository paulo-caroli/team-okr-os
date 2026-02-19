import type { CheckInView } from "@/lib/domain/check-in"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/components/ui/section-header"
import { formatDate } from "@/lib/utils"

interface CheckInDetailProps {
  checkIn: CheckInView
}

const confidenceVariant = {
  HIGH: "yes" as const,
  MEDIUM: "unknown" as const,
  LOW: "no" as const,
}

export function CheckInDetail({ checkIn }: CheckInDetailProps) {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Impact Check-in
          </h1>
          <Badge variant={confidenceVariant[checkIn.confidence]}>
            {checkIn.confidence} confidence
          </Badge>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {formatDate(checkIn.occurredAt)}
        </p>
        {checkIn.confidenceReason && (
          <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              What changed in our understanding
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
              {checkIn.confidenceReason}
            </p>
          </div>
        )}
      </div>

      <div>
        <SectionHeader title="R — Results Progress" className="mb-3" />
        <Card className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Primary Outcome
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {checkIn.primaryOutcomeSnapshot}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Value recorded at time of check-in
            </p>
          </div>
          <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {checkIn.resultsReflection}
            </p>
          </div>
        </Card>
      </div>

      {checkIn.supportingSignalSnapshots.length > 0 && (
        <div>
          <SectionHeader title="Supporting Signal Snapshots" className="mb-3" />
          <div className="space-y-2">
            {checkIn.supportingSignalSnapshots.map((snapshot) => (
              <Card key={snapshot.signalId} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {snapshot.metric}
                  </span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {snapshot.value}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {checkIn.initiativeReflection && (
        <div>
          <SectionHeader title="Initiative Reflection" className="mb-3" />
          <Card>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {checkIn.initiativeReflection}
            </p>
          </Card>
        </div>
      )}

      <div>
        <SectionHeader title="I — Issues" className="mb-3" />
        <Card>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {checkIn.issues}
          </p>
        </Card>
      </div>

      <div>
        <SectionHeader title="P — Plan Forward" className="mb-3" />
        <Card>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {checkIn.planForward}
          </p>
        </Card>
      </div>
    </div>
  )
}

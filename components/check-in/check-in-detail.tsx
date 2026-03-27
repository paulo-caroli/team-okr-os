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
            Check-in
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
              The reason behind this confidence level
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
          {checkIn.keyResultSnapshots.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Key result snapshots
              </p>
              <ul className="mt-2 space-y-2">
                {checkIn.keyResultSnapshots.map((s) => (
                  <li
                    key={s.keyResultId}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"
                  >
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{s.label}</span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {s.value}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Values recorded at time of check-in
              </p>
            </div>
          )}
          <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {checkIn.resultsReflection}
            </p>
          </div>
        </Card>
      </div>

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

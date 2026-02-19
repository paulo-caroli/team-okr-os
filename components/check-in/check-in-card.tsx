import type { CheckInView } from "@/lib/domain/check-in"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface CheckInCardProps {
  checkIn: CheckInView
  teamId: string
  commitmentId: string
}

const confidenceVariant = {
  HIGH: "yes" as const,
  MEDIUM: "unknown" as const,
  LOW: "no" as const,
}

export function CheckInCard({ checkIn, teamId, commitmentId }: CheckInCardProps) {
  return (
    <Link href={`/team/${teamId}/commitment/${commitmentId}/check-in/${checkIn.id}`}>
      <Card className="py-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {formatDate(checkIn.occurredAt)}
            </span>
            <Badge variant={confidenceVariant[checkIn.confidence]}>
              {checkIn.confidence} confidence
            </Badge>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Primary: {checkIn.primaryOutcomeSnapshot}
            </span>
          </div>
          <span className="text-sm text-zinc-400 dark:text-zinc-500">
            View details →
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {checkIn.issues}
        </p>
      </Card>
    </Link>
  )
}

import type { CheckInView } from "@/lib/domain/check-in"
import { SectionHeader } from "@/components/ui/section-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { CheckInCard } from "./check-in-card"
import Link from "next/link"

interface CheckInTimelineProps {
  checkIns: CheckInView[]
  commitmentId: string
  teamId: string
  readOnly?: boolean
}

export function CheckInTimeline({
  checkIns,
  commitmentId,
  teamId,
  readOnly = false,
}: CheckInTimelineProps) {
  return (
    <div>
      <SectionHeader
        title="Impact Check-ins"
        description={`${checkIns.length} sessions`}
        className="mb-4"
        action={
          !readOnly ? (
            <Link href={`/team/${teamId}/commitment/${commitmentId}/check-in/new`}>
              <Button variant="ghost" size="sm">
                + New check-in
              </Button>
            </Link>
          ) : undefined
        }
      />

      {checkIns.length === 0 ? (
        readOnly ? (
          <EmptyState
            title="No check-ins recorded"
            description="No impact check-ins were recorded during this commitment cycle."
          />
        ) : (
          <EmptyState
            title="No check-ins yet"
            description="Impact check-ins (GRIP) are structured conversations about whether key results are moving."
            action={
              <Link href={`/team/${teamId}/commitment/${commitmentId}/check-in/new`}>
                <Button size="sm">Run first check-in</Button>
              </Link>
            }
          />
        )
      ) : (
        <div className="space-y-2">
          {checkIns.map((checkIn) => (
            <CheckInCard
              key={checkIn.id}
              checkIn={checkIn}
              teamId={teamId}
              commitmentId={commitmentId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

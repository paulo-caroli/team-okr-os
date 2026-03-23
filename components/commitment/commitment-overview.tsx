"use client"

import type { CommitmentView } from "@/lib/domain/commitment"
import { flatKeyResults } from "@/lib/domain/commitment"
import type { InitiativeView } from "@/lib/domain/initiative"
import type { CheckInView } from "@/lib/domain/check-in"
import { StrategicIntentSection } from "./strategic-intent-section"
import { CycleSection } from "./cycle-section"
import { TeamOkrsSection } from "./team-okrs-section"
import { InitiativeList } from "@/components/initiative/initiative-list"
import { CheckInTimeline } from "@/components/check-in/check-in-timeline"
import { CommitmentStatusBar } from "./commitment-status-bar"
import { CompletionNotice } from "./completion-notice"
import { AbandonmentNotice } from "./abandonment-notice"

interface CommitmentOverviewProps {
  commitment: CommitmentView
  initiatives: InitiativeView[]
  checkIns: CheckInView[]
  teamId: string
}

export function CommitmentOverview({
  commitment,
  initiatives,
  checkIns,
  teamId,
}: CommitmentOverviewProps) {
  const readOnly = commitment.status !== "ACTIVE"
  const keyResults = flatKeyResults(commitment.objectives)

  return (
    <div className="space-y-8">
      <CommitmentStatusBar commitment={commitment} teamId={teamId} />

      {commitment.status === "COMPLETED" && (
        <CompletionNotice
          notes={commitment.completionNotes}
          completedAt={commitment.completedAt}
        />
      )}

      {commitment.status === "ABANDONED" && (
        <AbandonmentNotice
          reason={commitment.abandonmentReason}
          abandonedAt={commitment.abandonedAt}
        />
      )}

      <StrategicIntentSection intent={commitment.strategicIntent} />

      <div>
        <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Cycle</h2>
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          The time boundary for this commitment.
        </p>
        <CycleSection cycle={commitment.cycle} />
      </div>

      <TeamOkrsSection commitment={commitment} teamId={teamId} />

      <InitiativeList
        initiatives={initiatives}
        commitmentId={commitment.id}
        teamId={teamId}
        keyResults={keyResults}
        readOnly={readOnly}
      />

      <CheckInTimeline
        checkIns={checkIns}
        commitmentId={commitment.id}
        teamId={teamId}
        readOnly={readOnly}
      />
    </div>
  )
}

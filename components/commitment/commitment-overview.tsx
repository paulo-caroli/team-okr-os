"use client"

import type { CommitmentView } from "@/lib/domain/commitment"
import { flatKeyResults } from "@/lib/domain/commitment"
import type { InitiativeView } from "@/lib/domain/initiative"
import type { CheckInView } from "@/lib/domain/check-in"
import { TeamOkrHeading } from "./team-okr-heading"
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
      <TeamOkrHeading commitment={commitment} />

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

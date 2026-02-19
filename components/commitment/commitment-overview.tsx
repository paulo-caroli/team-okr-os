"use client"

import type { CommitmentView } from "@/lib/domain/commitment"
import type { InitiativeView } from "@/lib/domain/initiative"
import type { CheckInView } from "@/lib/domain/check-in"
import { StrategicIntentSection } from "./strategic-intent-section"
import { PrimaryOutcomeSection } from "./primary-outcome-section"
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

  return (
    <div className="space-y-8">
      <CommitmentStatusBar
        commitment={commitment}
        teamId={teamId}
      />

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

      <PrimaryOutcomeSection
        outcome={commitment.primaryOutcome}
        cycle={commitment.cycle}
        commitmentId={commitment.id}
        signals={commitment.supportingSignals}
      />

      <InitiativeList
        initiatives={initiatives}
        commitmentId={commitment.id}
        teamId={teamId}
        signals={commitment.supportingSignals}
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

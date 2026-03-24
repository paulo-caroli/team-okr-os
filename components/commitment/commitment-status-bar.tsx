"use client"

import type { CommitmentView } from "@/lib/domain/commitment"
import { CompleteCommitmentModal } from "./complete-commitment-modal"
import { AbandonCommitmentModal } from "./abandon-commitment-modal"
import { setPrimaryTeamOkr } from "@/lib/actions/commitment-actions"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"

interface CommitmentStatusBarProps {
  commitment: CommitmentView
  teamId: string
}

export function CommitmentStatusBar({
  commitment,
  teamId,
}: CommitmentStatusBarProps) {
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [abandonModalOpen, setAbandonModalOpen] = useState(false)
  const [primaryPending, startPrimary] = useTransition()

  if (commitment.status !== "ACTIVE") {
    return null
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {!commitment.isPrimary && (
          <Button
            size="sm"
            variant="ghost"
            loading={primaryPending}
            onClick={() =>
              startPrimary(() => {
                void setPrimaryTeamOkr(teamId, commitment.id)
              })
            }
          >
            Set as primary
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setCompleteModalOpen(true)}
        >
          Mark as completed
        </Button>
        <button
          type="button"
          className="text-sm text-red-500 underline hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          onClick={() => setAbandonModalOpen(true)}
        >
          End Team OKR
        </button>
      </div>

      <CompleteCommitmentModal
        teamId={teamId}
        commitmentId={commitment.id}
        open={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
      />

      <AbandonCommitmentModal
        teamId={teamId}
        commitmentId={commitment.id}
        open={abandonModalOpen}
        onClose={() => setAbandonModalOpen(false)}
      />
    </>
  )
}

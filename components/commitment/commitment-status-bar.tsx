"use client"

import type { CommitmentView } from "@/lib/domain/commitment"
import { CompleteCommitmentModal } from "./complete-commitment-modal"
import { AbandonCommitmentModal } from "./abandon-commitment-modal"
import { setPrimaryTeamOkr } from "@/lib/actions/commitment-actions"
import { Badge } from "@/components/ui/badge"
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

  const statusVariant =
    commitment.status === "ACTIVE"
      ? "active"
      : commitment.status === "DRAFT"
        ? "paused"
        : commitment.status === "COMPLETED"
          ? "completed"
          : "abandoned"

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant}>{commitment.status}</Badge>
          {commitment.status === "ACTIVE" && commitment.isPrimary && (
            <Badge variant="default">Primary OKR</Badge>
          )}
        </div>

        {commitment.status === "ACTIVE" && (
          <div className="flex flex-wrap items-center gap-3">
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
              Complete
            </Button>
            <button
              type="button"
              className="text-sm text-red-500 underline hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              onClick={() => setAbandonModalOpen(true)}
            >
              Abandon Commitment
            </button>
          </div>
        )}
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

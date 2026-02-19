"use client"

import type { CommitmentView } from "@/lib/domain/commitment"
import { CompleteCommitmentModal } from "./complete-commitment-modal"
import { AbandonCommitmentModal } from "./abandon-commitment-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"

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

  return (
    <>
      <div className="flex items-center justify-between">
        <Badge
          variant={
            commitment.status === "ACTIVE"
              ? "active"
              : commitment.status === "COMPLETED"
                ? "completed"
                : "abandoned"
          }
        >
          {commitment.status}
        </Badge>

        {commitment.status === "ACTIVE" && (
          <div className="flex items-center gap-3">
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

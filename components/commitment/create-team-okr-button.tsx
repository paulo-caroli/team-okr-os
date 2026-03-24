"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader } from "@/components/ui/dialog"

interface CreateTeamOkrButtonProps {
  teamId: string
  hasActiveOkr: boolean
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  label?: string
}

export function CreateTeamOkrButton({
  teamId,
  hasActiveOkr,
  variant = "primary",
  size = "md",
  label = "Create Team OKR",
}: CreateTeamOkrButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  function handleClick() {
    if (hasActiveOkr) {
      setConfirmOpen(true)
    } else {
      router.push(`/team/${teamId}/commitment/new`)
    }
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={handleClick}>
        {label}
      </Button>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogHeader
          title="Create another Team OKR?"
          description="Most teams focus on one Team OKR at a time. Are you sure you want to create another?"
        />
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/team/${teamId}/commitment/new`)}
          >
            Continue
          </Button>
        </div>
      </Dialog>
    </>
  )
}

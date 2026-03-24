"use client"

import { useActionState, useState, useRef, useEffect } from "react"
import { completeCommitment } from "@/lib/actions/commitment-actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface CompleteCommitmentModalProps {
  teamId: string
  commitmentId: string
  open: boolean
  onClose: () => void
}

export function CompleteCommitmentModal({
  teamId,
  commitmentId,
  open,
  onClose,
}: CompleteCommitmentModalProps) {
  const [state, formAction, isPending] = useActionState(completeCommitment, null)
  const [notes, setNotes] = useState("")
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setNotes("")
    }
  }, [open])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && open && !isPending) onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [open, onClose, isPending])

  if (!open) return null

  const tooShort = notes.length > 0 && notes.length < 20

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === backdropRef.current && !isPending) onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Mark this Team OKR as completed?
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          This will close the current Team OKR and archive it as completed.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="commitmentId" value={commitmentId} />

          {state?.error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {state.error}
            </div>
          )}

          <Textarea
            name="completionNotes"
            label="What did we learn from this Team OKR?"
            placeholder="e.g. Conversion improved after simplifying checkout. Experiment cadence mattered."
            hint="Capture key insights — not a status report."
            required
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            error={tooShort ? "Please provide at least 20 characters." : undefined}
          />

          <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={isPending}
              disabled={notes.trim().length < 20}
            >
              Confirm Completion
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

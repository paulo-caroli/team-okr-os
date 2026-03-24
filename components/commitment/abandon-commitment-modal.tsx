"use client"

import { useActionState, useState, useRef, useEffect } from "react"
import { abandonCommitment } from "@/lib/actions/commitment-actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface AbandonCommitmentModalProps {
  teamId: string
  commitmentId: string
  open: boolean
  onClose: () => void
}

export function AbandonCommitmentModal({
  teamId,
  commitmentId,
  open,
  onClose,
}: AbandonCommitmentModalProps) {
  const [state, formAction, isPending] = useActionState(abandonCommitment, null)
  const [reason, setReason] = useState("")
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setReason("")
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

  const tooShort = reason.length > 0 && reason.length < 15

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
          End this Team OKR?
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          This will end the current Team OKR before the cycle is complete.
          <br />
          <br />
          Objective and key result definitions will remain locked as recorded.
          All GRIP history will be preserved.
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
            name="abandonmentReason"
            label="Why are you ending this Team OKR?"
            placeholder="e.g. The original metric is no longer the right indicator. We discovered a stronger constraint."
            hint="Be specific. This becomes part of the learning record."
            required
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={tooShort ? "Please provide at least 15 characters." : undefined}
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
              variant="destructive"
              size="sm"
              loading={isPending}
              disabled={reason.trim().length < 15}
            >
              End Team OKR
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

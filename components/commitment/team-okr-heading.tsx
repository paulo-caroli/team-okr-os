"use client"

import { useState } from "react"
import type { CommitmentView, CommitmentStatus } from "@/lib/domain/commitment"
import { formatDate, cycleProgress, daysRemaining } from "@/lib/utils"
import { updateTeamOkrTitle, updateTeamOkrContext } from "@/lib/actions/commitment-actions"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface TeamOkrHeadingProps {
  commitment: CommitmentView
}

function statusLabel(status: CommitmentStatus): string {
  const labels: Record<CommitmentStatus, string> = {
    ACTIVE: "Active",
    DRAFT: "Draft",
    COMPLETED: "Completed",
    ABANDONED: "Ended",
  }
  return labels[status]
}

export function TeamOkrHeading({ commitment }: TeamOkrHeadingProps) {
  const readOnly = commitment.status !== "ACTIVE"
  const kindLabel = commitment.isPrimary ? "Primary Team OKR" : "Team OKR"
  const displayTitle =
    commitment.title.trim() ||
    commitment.cycle.label?.trim() ||
    "Team OKR"
  const objective = commitment.teamObjective.trim()
  const { cycle } = commitment

  const cycleLabelPart =
    cycle.label?.trim() ||
    `${formatDate(cycle.startDate)} — ${formatDate(cycle.endDate)}`
  const cycleLine = `Cycle: ${cycleLabelPart}`

  const progressBits: string[] = []
  if (commitment.status === "ACTIVE" || commitment.status === "DRAFT") {
    const pct = cycleProgress(cycle.startDate, cycle.endDate)
    const remaining = daysRemaining(cycle.endDate)
    progressBits.push(`${pct}% of cycle elapsed`)
    if (remaining > 0) {
      progressBits.push(`${remaining} days remaining`)
    } else {
      progressBits.push("Cycle ended")
    }
  }
  if (commitment.initiativeCount > 0) {
    progressBits.push(
      `${commitment.initiativeCount} initiative${commitment.initiativeCount === 1 ? "" : "s"}`
    )
  }
  if (commitment.checkInCount > 0) {
    progressBits.push(
      `${commitment.checkInCount} check-in${commitment.checkInCount === 1 ? "" : "s"}`
    )
  }
  const progressLine = progressBits.length > 0 ? progressBits.join(" · ") : null

  const [editingTitle, setEditingTitle] = useState(false)
  const [savingTitle, setSavingTitle] = useState(false)
  const [editingContext, setEditingContext] = useState(false)
  const [savingContext, setSavingContext] = useState(false)

  async function handleTitleSave(formData: FormData) {
    const value = (formData.get("title") as string)?.trim()
    if (!value) return
    setSavingTitle(true)
    await updateTeamOkrTitle(commitment.id, value)
    setEditingTitle(false)
    setSavingTitle(false)
  }

  async function handleContextSave(formData: FormData) {
    const value = (formData.get("context") as string) ?? ""
    setSavingContext(true)
    await updateTeamOkrContext(commitment.id, value)
    setEditingContext(false)
    setSavingContext(false)
  }

  return (
    <header className="space-y-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {kindLabel}
      </p>

      {!readOnly && editingTitle ? (
        <form action={handleTitleSave} className="flex items-center gap-2">
          <Input
            name="title"
            defaultValue={commitment.title}
            placeholder="Team OKR title"
            className="text-2xl font-semibold"
            autoFocus
            required
          />
          <Button size="sm" type="submit" loading={savingTitle}>Save</Button>
          <Button size="sm" variant="ghost" type="button" onClick={() => setEditingTitle(false)}>Cancel</Button>
        </form>
      ) : (
        <h1
          className={`text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100${!readOnly ? " cursor-pointer decoration-dashed hover:underline hover:underline-offset-4" : ""}`}
          onClick={!readOnly ? () => setEditingTitle(true) : undefined}
        >
          {displayTitle}
        </h1>
      )}

      {!readOnly && editingContext ? (
        <form action={handleContextSave} className="max-w-3xl space-y-2">
          <Textarea
            name="context"
            defaultValue={commitment.teamObjective}
            placeholder="Why this matters and how it connects to the bigger picture"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" type="submit" loading={savingContext}>Save</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setEditingContext(false)}>Cancel</Button>
          </div>
        </form>
      ) : objective ? (
        <p
          className={`max-w-3xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400 whitespace-pre-wrap${!readOnly ? " cursor-pointer decoration-dashed hover:underline hover:underline-offset-4" : ""}`}
          onClick={!readOnly ? () => setEditingContext(true) : undefined}
        >
          {objective}
        </p>
      ) : !readOnly ? (
        <p
          className="max-w-3xl cursor-pointer text-sm italic leading-relaxed text-zinc-400 decoration-dashed hover:underline hover:underline-offset-4 dark:text-zinc-500"
          onClick={() => setEditingContext(true)}
        >
          Add strategic context...
        </p>
      ) : (
        <p className="max-w-3xl text-sm italic leading-relaxed text-zinc-400 dark:text-zinc-500">
          Define the outcome your team wants to achieve.
        </p>
      )}

      <div className="pt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        <p>{cycleLine}</p>
        <p className="mt-1">Status: {statusLabel(commitment.status)}</p>
        {progressLine ? <p className="mt-1">{progressLine}</p> : null}
      </div>
    </header>
  )
}

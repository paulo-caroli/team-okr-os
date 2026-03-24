import type { CommitmentView, CommitmentStatus } from "@/lib/domain/commitment"
import { formatDate, cycleProgress, daysRemaining } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface TeamOkrHeadingProps {
  commitment: CommitmentView
  editMode?: boolean
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

export function TeamOkrHeading({ commitment, editMode }: TeamOkrHeadingProps) {
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

  return (
    <header className="space-y-3 border-b border-zinc-200 pb-8 dark:border-zinc-800">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {kindLabel}
      </p>

      {editMode ? (
        <Input
          name="title"
          defaultValue={commitment.title}
          placeholder="Team OKR title"
          className="text-2xl font-semibold"
          required
        />
      ) : (
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
          {displayTitle}
        </h1>
      )}

      {editMode ? (
        <Textarea
          name="context"
          label="Strategic Context"
          defaultValue={commitment.teamObjective}
          placeholder="Why this matters and how it connects to the bigger picture"
          rows={3}
        />
      ) : objective ? (
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400 whitespace-pre-wrap">
          {objective}
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

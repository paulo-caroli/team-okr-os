import type { CommitmentView, CommitmentStatus } from "@/lib/domain/commitment"
import { formatDateShort, daysRemaining } from "@/lib/utils"
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

  const dateRange = `${formatDateShort(cycle.startDate)} \u2192 ${formatDateShort(cycle.endDate)}`
  const cycleLabelPart = cycle.label?.trim()
    ? `${cycle.label.trim()} (${dateRange})`
    : dateRange
  const cycleLine = `Cycle: ${cycleLabelPart}`

  const isLive = commitment.status === "ACTIVE" || commitment.status === "DRAFT"
  const remaining = daysRemaining(cycle.endDate)
  const remainingLine = isLive
    ? remaining > 0
      ? `${remaining} days remaining`
      : "Cycle ended"
    : null

  const statBits: string[] = []
  if (commitment.initiativeCount > 0) {
    statBits.push(
      `${commitment.initiativeCount} initiative${commitment.initiativeCount === 1 ? "" : "s"}`
    )
  }
  if (commitment.checkInCount > 0) {
    statBits.push(
      `${commitment.checkInCount} check-in${commitment.checkInCount === 1 ? "" : "s"}`
    )
  }
  const statsLine = statBits.length > 0 ? statBits.join(" \u00b7 ") : null

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
        {remainingLine && (
          <p className="mt-1 font-medium text-zinc-600 dark:text-zinc-300">{remainingLine}</p>
        )}
        <p className="mt-1">Status: {statusLabel(commitment.status)}</p>
        {statsLine && <p className="mt-1">{statsLine}</p>}
      </div>
    </header>
  )
}

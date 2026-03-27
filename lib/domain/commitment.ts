export interface KeyResult {
  id: string
  title: string
  metric: string
  baseline: number | null
  target: number
  current: number
  dueDate: Date | null
  sortOrder: number
}

export interface ObjectiveView {
  id: string
  title: string
  description: string | null
  sortOrder: number
  keyResults: KeyResult[]
}

export interface Cycle {
  label: string | null
  startDate: Date
  endDate: Date
}

export type CommitmentStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ABANDONED"

export interface CommitmentView {
  id: string
  teamId: string
  /** Short scan-friendly title */
  title: string
  /** Full team-level outcome statement */
  teamObjective: string
  objectives: ObjectiveView[]
  cycle: Cycle
  status: CommitmentStatus
  isPrimary: boolean
  completionNotes: string | null
  completedAt: Date | null
  abandonmentReason: string | null
  abandonedAt: Date | null
  initiativeCount: number
  checkInCount: number
  createdAt: Date
  updatedAt: Date
}

/** @alias CommitmentView — domain Team OKR */
export type TeamOkrView = CommitmentView

/**
 * Core progress ratio for a key result.
 * Returns a decimal between 0 and 1 (e.g. 0.75 = 75%).
 * Handles both increasing (target > baseline) and decreasing (target < baseline) KRs.
 */
export function calculateProgress(
  current: number,
  target: number,
  baseline: number | null,
): number {
  if (baseline !== null && baseline !== undefined) {
    if (baseline === target) return 0
    const progress = (current - baseline) / (target - baseline)
    return Math.max(0, Math.min(progress, 1))
  }

  if (!target || target === 0) return 0
  return Math.max(0, Math.min(current / target, 1))
}

/** Progress percentage for one key result. Not clamped — may be negative or exceed 100. */
export function keyResultProgressPercent(kr: KeyResult): number {
  return calculateProgress(kr.current, kr.target, kr.baseline) * 100
}

/** Average KR progress; 0 if there are no key results. */
export function aggregateKeyResultProgress(objective: ObjectiveView): number {
  const krs = objective.keyResults
  if (krs.length === 0) return 0
  const sum = krs.reduce((acc, kr) => acc + keyResultProgressPercent(kr), 0)
  return sum / krs.length
}

/** All key results for a Team OKR (initiatives, GRIP). */
export function flatKeyResults(objectives: ObjectiveView[]): KeyResult[] {
  return objectives.flatMap((o) => o.keyResults)
}

/** Sort KRs by target date: overdue first, then earliest date, fallback to cycle end. */
export function sortKeyResultsByDate(keyResults: KeyResult[], cycleEndDate: Date): KeyResult[] {
  return [...keyResults].sort((a, b) => {
    const now = Date.now()
    const dateA = new Date(a.dueDate ?? cycleEndDate).getTime()
    const dateB = new Date(b.dueDate ?? cycleEndDate).getTime()
    const aOverdue = dateA < now
    const bOverdue = dateB < now

    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1
    if (dateA !== dateB) return dateA - dateB
    if (!!a.dueDate !== !!b.dueDate) return a.dueDate ? -1 : 1

    return a.sortOrder - b.sortOrder
  })
}

interface ExportInitiative {
  name: string
  hypothesis: string
  status: string
  expectedImpact: { keyResultIds: string[] } | null
  conclusionReason?: string | null
  conclusionImpact?: string | null
}

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  CONCLUDED: "Concluded",
}

/**
 * Build a clean, human-readable text representation of a Team OKR
 * suitable for pasting into ChatGPT or similar analysis tools.
 */
export function buildTeamOkrExport(
  commitment: CommitmentView,
  initiatives: ExportInitiative[],
  fmtDate: (d: Date) => string,
): string {
  const { cycle } = commitment
  const dateRange = `${fmtDate(cycle.startDate)} \u2192 ${fmtDate(cycle.endDate)}`
  const cycleLabel = cycle.label?.trim()
    ? `${cycle.label.trim()} (${dateRange})`
    : dateRange

  const lines: string[] = []

  const title = commitment.title?.trim()
  if (title) {
    lines.push(`Team OKR \u2014 ${title}`)
    lines.push(cycleLabel)
  } else {
    lines.push(`Team OKR \u2014 ${cycleLabel}`)
  }
  lines.push("")

  const strategicContext = commitment.teamObjective?.trim()
  if (strategicContext) {
    lines.push("Strategic context:")
    lines.push(strategicContext)
    lines.push("")
  }

  const obj = commitment.objectives[0]
  const allKRs = obj ? obj.keyResults : []
  const krTitleMap = new Map(allKRs.map((kr) => [kr.id, kr.title]))

  if (obj) {
    lines.push("Objective:")
    lines.push(obj.title)
    if (obj.description?.trim()) {
      lines.push(obj.description.trim())
    }
    lines.push("")

    const sortedKRs = sortKeyResultsByDate(allKRs, cycle.endDate)
    if (sortedKRs.length > 0) {
      lines.push("Key Results:")
      lines.push("")
      sortedKRs.forEach((kr, i) => {
        const hasCustomDate = !!kr.dueDate
        const effectiveDate = kr.dueDate ?? cycle.endDate
        const datePart = hasCustomDate
          ? fmtDate(effectiveDate)
          : `End of cycle (${fmtDate(cycle.endDate)})`

        lines.push(`${i + 1}. ${kr.title}`)

        if (kr.metric) {
          lines.push(`   Metric: ${kr.metric}`)
        }

        const progressParts: string[] = []
        if (kr.baseline !== null) progressParts.push(`Baseline ${kr.baseline}`)
        progressParts.push(`Current ${kr.current}`)
        progressParts.push(`Target ${kr.target}`)
        lines.push(`   Progress: ${progressParts.join(" \u00b7 ")}`)

        lines.push(`   Target date: ${datePart}`)

        const related = initiatives
          .filter(
            (init) =>
              init.status !== "CONCLUDED" &&
              init.expectedImpact?.keyResultIds.includes(kr.id),
          )
          .slice(0, 5)

        if (related.length > 0) {
          lines.push("")
          lines.push("   Initiatives (current bets):")
          for (const init of related) {
            const label = STATUS_LABEL[init.status]
            const hint = label && init.status !== "NOT_STARTED" ? ` (${label})` : ""
            lines.push(`   - ${init.name}${hint}`)
          }
        }
        lines.push("")
      })
    }
  }

  if (initiatives.length > 0) {
    lines.push("---")
    lines.push("")
    lines.push("Initiative details (full context)")
    lines.push("")

    for (const init of initiatives) {
      lines.push(init.name)
      lines.push("")

      const label = STATUS_LABEL[init.status]
      if (label) {
        lines.push(`Status: ${label}`)
      }

      if (init.hypothesis?.trim()) {
        lines.push(`Hypothesis: ${init.hypothesis.trim()}`)
      }

      const impactIds = init.expectedImpact?.keyResultIds ?? []
      const impactTitles = impactIds
        .map((id) => krTitleMap.get(id))
        .filter(Boolean) as string[]
      if (impactTitles.length > 0) {
        lines.push("Impacts:")
        for (const t of impactTitles) {
          lines.push(`- ${t}`)
        }
      }

      if (init.status === "CONCLUDED") {
        if (init.conclusionReason?.trim()) {
          lines.push(`Conclusion: ${init.conclusionReason.trim()}`)
        }
        if (init.conclusionImpact?.trim()) {
          lines.push(`Impact: ${init.conclusionImpact.trim()}`)
        }
      }

      lines.push("")
    }
  }

  return lines.join("\n").trimEnd() + "\n"
}

export function toCommitmentView(raw: {
  id: string
  teamId: string
  title: string
  teamObjective: string
  cycleLabel: string | null
  cycleStartDate: Date
  cycleEndDate: Date
  status: CommitmentStatus
  isPrimary: boolean
  completionNotes: string | null
  completedAt: Date | null
  abandonmentReason: string | null
  abandonedAt: Date | null
  objectives: Array<{
    id: string
    title: string
    description: string | null
    sortOrder: number
    keyResults: Array<{
      id: string
      title: string
      metric: string
      baseline: number | null
      target: number
      current: number
      dueDate: Date | null
      sortOrder: number
    }>
  }>
  _count?: { initiatives: number; checkIns: number }
  createdAt: Date
  updatedAt: Date
}): CommitmentView {
  return {
    id: raw.id,
    teamId: raw.teamId,
    title: raw.title,
    teamObjective: raw.teamObjective,
    objectives: raw.objectives.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      sortOrder: o.sortOrder,
      keyResults: o.keyResults.map((kr) => ({
        id: kr.id,
        title: kr.title,
        metric: kr.metric,
        baseline: kr.baseline,
        target: kr.target,
        current: kr.current,
        dueDate: kr.dueDate,
        sortOrder: kr.sortOrder,
      })),
    })),
    cycle: {
      label: raw.cycleLabel,
      startDate: raw.cycleStartDate,
      endDate: raw.cycleEndDate,
    },
    status: raw.status,
    isPrimary: raw.isPrimary,
    completionNotes: raw.completionNotes,
    completedAt: raw.completedAt,
    abandonmentReason: raw.abandonmentReason,
    abandonedAt: raw.abandonedAt,
    initiativeCount: raw._count?.initiatives ?? 0,
    checkInCount: raw._count?.checkIns ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

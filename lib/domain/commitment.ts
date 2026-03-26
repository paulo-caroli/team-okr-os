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

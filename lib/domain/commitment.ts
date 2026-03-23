export interface StrategicIntent {
  text: string
}

export interface KeyResult {
  id: string
  title: string
  metric: string
  baseline: number | null
  target: number
  current: number
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

export type CommitmentStatus = "ACTIVE" | "COMPLETED" | "ABANDONED"

export interface CommitmentView {
  id: string
  teamId: string
  strategicIntent: StrategicIntent
  objectives: ObjectiveView[]
  cycle: Cycle
  status: CommitmentStatus
  completionNotes: string | null
  completedAt: Date | null
  abandonmentReason: string | null
  abandonedAt: Date | null
  initiativeCount: number
  checkInCount: number
  createdAt: Date
  updatedAt: Date
}

/** 0–100 progress for one key result (clamped). */
export function keyResultProgressPercent(kr: KeyResult): number {
  const baseline = kr.baseline ?? kr.target
  const span = kr.target - baseline
  if (span === 0) {
    return kr.current >= kr.target ? 100 : 0
  }
  const raw = ((kr.current - baseline) / span) * 100
  return Math.min(100, Math.max(0, raw))
}

/** Average KR progress; 0 if there are no key results. */
export function objectiveProgressPercent(objective: ObjectiveView): number {
  const krs = objective.keyResults
  if (krs.length === 0) return 0
  const sum = krs.reduce((acc, kr) => acc + keyResultProgressPercent(kr), 0)
  return sum / krs.length
}

/** All key results for a commitment (e.g. initiative impact pickers, GRIP form). */
export function flatKeyResults(objectives: ObjectiveView[]): KeyResult[] {
  return objectives.flatMap((o) => o.keyResults)
}

export function toCommitmentView(raw: {
  id: string
  teamId: string
  strategicIntent: string
  cycleLabel: string | null
  cycleStartDate: Date
  cycleEndDate: Date
  status: CommitmentStatus
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
    strategicIntent: { text: raw.strategicIntent },
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
        sortOrder: kr.sortOrder,
      })),
    })),
    cycle: {
      label: raw.cycleLabel,
      startDate: raw.cycleStartDate,
      endDate: raw.cycleEndDate,
    },
    status: raw.status,
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

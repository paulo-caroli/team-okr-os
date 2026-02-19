export interface StrategicIntent {
  text: string
}

export interface PrimaryOutcome {
  outcomeStatement: string | null
  metric: string
  baseline: number | null
  target: number
  current: number
}

export interface Cycle {
  label: string | null
  startDate: Date
  endDate: Date
}

export interface SupportingSignal {
  id: string
  statement: string | null
  metric: string
  baseline: number | null
  target: number
  current: number
  order: number
}

export type CommitmentStatus = "ACTIVE" | "COMPLETED" | "ABANDONED"

export interface CommitmentView {
  id: string
  teamId: string
  strategicIntent: StrategicIntent
  primaryOutcome: PrimaryOutcome
  cycle: Cycle
  status: CommitmentStatus
  completionNotes: string | null
  completedAt: Date | null
  abandonmentReason: string | null
  abandonedAt: Date | null
  supportingSignals: SupportingSignal[]
  initiativeCount: number
  checkInCount: number
  createdAt: Date
  updatedAt: Date
}

export function toCommitmentView(raw: {
  id: string
  teamId: string
  strategicIntent: string
  primaryOutcomeStatement: string | null
  primaryMetric: string
  primaryBaseline: number | null
  primaryTarget: number
  primaryCurrent: number
  cycleLabel: string | null
  cycleStartDate: Date
  cycleEndDate: Date
  status: CommitmentStatus
  completionNotes: string | null
  completedAt: Date | null
  abandonmentReason: string | null
  abandonedAt: Date | null
  supportingSignals: SupportingSignal[]
  _count?: { initiatives: number; checkIns: number }
  createdAt: Date
  updatedAt: Date
}): CommitmentView {
  return {
    id: raw.id,
    teamId: raw.teamId,
    strategicIntent: { text: raw.strategicIntent },
    primaryOutcome: {
      outcomeStatement: raw.primaryOutcomeStatement,
      metric: raw.primaryMetric,
      baseline: raw.primaryBaseline,
      target: raw.primaryTarget,
      current: raw.primaryCurrent,
    },
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
    supportingSignals: raw.supportingSignals,
    initiativeCount: raw._count?.initiatives ?? 0,
    checkInCount: raw._count?.checkIns ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

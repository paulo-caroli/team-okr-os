import { db } from "@/lib/db"
import type { CheckInView, SignalSnapshot } from "@/lib/domain/check-in"

function parseSignalSnapshots(
  raw: unknown,
  commitmentId: string
): SignalSnapshot[] {
  if (!raw || typeof raw !== "object") return []
  const entries = Object.entries(raw as Record<string, number>)
  return entries.map(([signalId, value]) => ({
    signalId,
    metric: signalId,
    value,
  }))
}

async function enrichSignalSnapshots(
  snapshots: SignalSnapshot[]
): Promise<SignalSnapshot[]> {
  if (snapshots.length === 0) return []

  const signals = await db.supportingSignal.findMany({
    where: { id: { in: snapshots.map((s) => s.signalId) } },
    select: { id: true, metric: true },
  })
  const metricMap = new Map(signals.map((s) => [s.id, s.metric]))

  return snapshots.map((s) => ({
    ...s,
    metric: metricMap.get(s.signalId) ?? s.signalId,
  }))
}

export async function getCheckIns(
  commitmentId: string
): Promise<CheckInView[]> {
  const sessions = await db.gripSession.findMany({
    where: { commitmentId },
    orderBy: { occurredAt: "desc" },
  })

  const views = await Promise.all(
    sessions.map(async (s) => {
      const rawSnapshots = parseSignalSnapshots(
        s.supportingSignalSnapshots,
        s.commitmentId
      )
      const enriched = await enrichSignalSnapshots(rawSnapshots)

      return {
        id: s.id,
        commitmentId: s.commitmentId,
        occurredAt: s.occurredAt,
        confidence: s.confidence,
        confidenceReason: s.confidenceReason,
        primaryOutcomeSnapshot: s.primaryOutcomeSnapshot,
        resultsReflection: s.resultsReflection,
        initiativeReflection: s.initiativeReflection,
        issues: s.issues,
        planForward: s.planForward,
        supportingSignalSnapshots: enriched,
        createdAt: s.createdAt,
      } satisfies CheckInView
    })
  )

  return views
}

export async function getCheckIn(
  checkInId: string
): Promise<CheckInView | null> {
  const s = await db.gripSession.findUnique({
    where: { id: checkInId },
  })

  if (!s) return null

  const rawSnapshots = parseSignalSnapshots(
    s.supportingSignalSnapshots,
    s.commitmentId
  )
  const enriched = await enrichSignalSnapshots(rawSnapshots)

  return {
    id: s.id,
    commitmentId: s.commitmentId,
    occurredAt: s.occurredAt,
    confidence: s.confidence,
    confidenceReason: s.confidenceReason,
    primaryOutcomeSnapshot: s.primaryOutcomeSnapshot,
    resultsReflection: s.resultsReflection,
    initiativeReflection: s.initiativeReflection,
    issues: s.issues,
    planForward: s.planForward,
    supportingSignalSnapshots: enriched,
    createdAt: s.createdAt,
  }
}

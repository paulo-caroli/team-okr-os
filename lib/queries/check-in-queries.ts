import { db } from "@/lib/db"
import type { CheckInView, KeyResultSnapshot } from "@/lib/domain/check-in"

function parseKeyResultSnapshots(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v
    } else if (typeof v === "string") {
      const n = parseFloat(v)
      if (Number.isFinite(n)) out[k] = n
    }
  }
  return out
}

async function enrichKeyResultSnapshots(
  snapshots: Record<string, number>
): Promise<KeyResultSnapshot[]> {
  const ids = Object.keys(snapshots)
  if (ids.length === 0) return []

  const krs = await db.keyResult.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, metric: true },
  })
  const labelMap = new Map(
    krs.map((kr) => [kr.id, kr.title || kr.metric])
  )

  return ids.map((keyResultId) => ({
    keyResultId,
    label: labelMap.get(keyResultId) ?? keyResultId,
    value: snapshots[keyResultId]!,
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
      const parsed = parseKeyResultSnapshots(s.keyResultSnapshots)
      const enriched = await enrichKeyResultSnapshots(parsed)

      return {
        id: s.id,
        commitmentId: s.commitmentId,
        occurredAt: s.occurredAt,
        confidence: s.confidence,
        confidenceReason: s.confidenceReason,
        keyResultSnapshots: enriched,
        resultsReflection: s.resultsReflection,
        initiativeReflection: s.initiativeReflection,
        issues: s.issues,
        planForward: s.planForward,
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

  const parsed = parseKeyResultSnapshots(s.keyResultSnapshots)
  const enriched = await enrichKeyResultSnapshots(parsed)

  return {
    id: s.id,
    commitmentId: s.commitmentId,
    occurredAt: s.occurredAt,
    confidence: s.confidence,
    confidenceReason: s.confidenceReason,
    keyResultSnapshots: enriched,
    resultsReflection: s.resultsReflection,
    initiativeReflection: s.initiativeReflection,
    issues: s.issues,
    planForward: s.planForward,
    createdAt: s.createdAt,
  }
}

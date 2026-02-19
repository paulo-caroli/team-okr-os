import { db } from "@/lib/db"
import { toCommitmentView, type CommitmentView } from "@/lib/domain/commitment"

export async function getActiveCommitment(
  teamId: string
): Promise<CommitmentView | null> {
  const commitment = await db.teamCommitment.findFirst({
    where: { teamId, status: "ACTIVE" },
    include: {
      supportingSignals: { orderBy: { order: "asc" } },
      _count: { select: { initiatives: true, checkIns: true } },
    },
  })

  if (!commitment) return null
  return toCommitmentView(commitment)
}

export async function getCommitment(
  commitmentId: string
): Promise<CommitmentView | null> {
  const commitment = await db.teamCommitment.findUnique({
    where: { id: commitmentId },
    include: {
      supportingSignals: { orderBy: { order: "asc" } },
      _count: { select: { initiatives: true, checkIns: true } },
    },
  })

  if (!commitment) return null
  return toCommitmentView(commitment)
}

export async function getCommitmentHistory(
  teamId: string
): Promise<CommitmentView[]> {
  const commitments = await db.teamCommitment.findMany({
    where: { teamId, status: { not: "ACTIVE" } },
    include: {
      supportingSignals: { orderBy: { order: "asc" } },
      _count: { select: { initiatives: true, checkIns: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return commitments.map(toCommitmentView)
}

export async function getLastAbandonedCommitment(
  teamId: string
): Promise<CommitmentView | null> {
  const commitment = await db.teamCommitment.findFirst({
    where: { teamId, status: "ABANDONED" },
    include: {
      supportingSignals: { orderBy: { order: "asc" } },
      _count: { select: { initiatives: true, checkIns: true } },
    },
    orderBy: { abandonedAt: "desc" },
  })

  if (!commitment) return null
  return toCommitmentView(commitment)
}

export async function getLastInactiveCommitment(
  teamId: string
): Promise<CommitmentView | null> {
  const commitment = await db.teamCommitment.findFirst({
    where: { teamId, status: { not: "ACTIVE" } },
    include: {
      supportingSignals: { orderBy: { order: "asc" } },
      _count: { select: { initiatives: true, checkIns: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  if (!commitment) return null
  return toCommitmentView(commitment)
}

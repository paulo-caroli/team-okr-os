import { db } from "@/lib/db"
import { toCommitmentView, type CommitmentView } from "@/lib/domain/commitment"
const objectiveInclude = {
  orderBy: { sortOrder: "asc" as const },
  include: {
    keyResults: { orderBy: { sortOrder: "asc" as const } },
  },
}

const teamOkrInclude = {
  include: {
    objectives: objectiveInclude,
    _count: { select: { initiatives: true, checkIns: true } },
  },
} as const

/** All ACTIVE Team OKRs for a team (primary first). */
export async function getActiveTeamOkrs(teamId: string): Promise<CommitmentView[]> {
  const rows = await db.teamOkr.findMany({
    where: { teamId, status: "ACTIVE" },
    ...teamOkrInclude,
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  })
  return rows.map(toCommitmentView)
}

/** Primary ACTIVE Team OKR, or first ACTIVE if none flagged primary. */
export async function getPrimaryTeamOkr(teamId: string): Promise<CommitmentView | null> {
  let row = await db.teamOkr.findFirst({
    where: { teamId, status: "ACTIVE", isPrimary: true },
    ...teamOkrInclude,
  })
  if (!row) {
    row = await db.teamOkr.findFirst({
      where: { teamId, status: "ACTIVE" },
      ...teamOkrInclude,
      orderBy: { createdAt: "asc" },
    })
  }
  if (!row) return null
  return toCommitmentView(row)
}

/** @deprecated Use getPrimaryTeamOkr or getActiveTeamOkrs */
export async function getActiveCommitment(
  teamId: string
): Promise<CommitmentView | null> {
  return getPrimaryTeamOkr(teamId)
}

export async function getCommitment(teamOkrId: string): Promise<CommitmentView | null> {
  const row = await db.teamOkr.findUnique({
    where: { id: teamOkrId },
    ...teamOkrInclude,
  })
  if (!row) return null
  return toCommitmentView(row)
}

export async function getCommitmentHistory(teamId: string): Promise<CommitmentView[]> {
  const rows = await db.teamOkr.findMany({
    where: { teamId, status: { in: ["COMPLETED", "ABANDONED"] } },
    ...teamOkrInclude,
    orderBy: { createdAt: "desc" },
  })
  return rows.map(toCommitmentView)
}

export async function getLastAbandonedCommitment(
  teamId: string
): Promise<CommitmentView | null> {
  const row = await db.teamOkr.findFirst({
    where: { teamId, status: "ABANDONED" },
    ...teamOkrInclude,
    orderBy: { abandonedAt: "desc" },
  })
  if (!row) return null
  return toCommitmentView(row)
}

export async function getLastInactiveCommitment(
  teamId: string
): Promise<CommitmentView | null> {
  const row = await db.teamOkr.findFirst({
    where: { teamId, status: { in: ["COMPLETED", "ABANDONED"] } },
    ...teamOkrInclude,
    orderBy: { updatedAt: "desc" },
  })
  if (!row) return null
  return toCommitmentView(row)
}

import { db } from "@/lib/db"

type CountableModel = "User" | "Team" | "TeamCommitment" | "GripSession"

export interface Totals {
  users: number
  teams: number
  commitments: number
  checkIns: number
}

export interface TotalsLast7Days {
  commitments: number
  checkIns: number
}

export interface DailyCount {
  day: string
  count: number
}

export async function getTotals(): Promise<Totals> {
  const [users, teams, commitments, checkIns] = await Promise.all([
    db.user.count(),
    db.team.count(),
    db.teamCommitment.count(),
    db.gripSession.count(),
  ])
  return { users, teams, commitments, checkIns }
}

export async function getTotalsLast7Days(): Promise<TotalsLast7Days> {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const [commitments, checkIns] = await Promise.all([
    db.teamCommitment.count({ where: { createdAt: { gte: since } } }),
    db.gripSession.count({ where: { createdAt: { gte: since } } }),
  ])
  return { commitments, checkIns }
}

export async function getDailyCounts({
  model,
  days = 14,
}: {
  model: CountableModel
  days?: number
}): Promise<DailyCount[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const table = getTableName(model)
  const result = await db.$queryRawUnsafe<Array<{ day: Date; count: bigint }>>(
    `SELECT date_trunc('day', "createdAt")::date as day, count(*)::bigint as count
     FROM "${table}"
     WHERE "createdAt" >= $1
     GROUP BY date_trunc('day', "createdAt")
     ORDER BY day ASC`,
    since
  )

  return result.map((row) => ({
    day: row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day).slice(0, 10),
    count: Number(row.count),
  }))
}

function getTableName(model: CountableModel): string {
  const map: Record<CountableModel, string> = {
    User: "User",
    Team: "Team",
    TeamCommitment: "TeamCommitment",
    GripSession: "GripSession",
  }
  return map[model]
}

export interface ActiveUserRow {
  userId: string
  name: string
  email: string
  teams: string[]
  lastActivityAt: Date
  checkInCount: number
  initiativeCount: number
}

/**
 * Users who are members of teams that had check-in or initiative activity in the last 7 days.
 * Activity is inferred via Team -> Commitment -> GripSession/Initiative (no userId on those models).
 */
export async function getActiveUsersLast7Days(): Promise<ActiveUserRow[]> {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const [checkIns, initiatives, members] = await Promise.all([
    db.gripSession.findMany({
      where: { createdAt: { gte: since } },
      select: {
        createdAt: true,
        commitment: { select: { teamId: true } },
      },
    }),
    db.initiative.findMany({
      where: { createdAt: { gte: since } },
      select: {
        createdAt: true,
        commitment: { select: { teamId: true } },
      },
    }),
    db.teamMember.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { name: true } },
      },
    }),
  ])

  const teamIdsFromActivity = new Set<string>()
  for (const c of checkIns) teamIdsFromActivity.add(c.commitment.teamId)
  for (const i of initiatives) teamIdsFromActivity.add(i.commitment.teamId)

  const membersInActiveTeams = members.filter((m) =>
    teamIdsFromActivity.has(m.teamId)
  )

  const byUserId = new Map<
    string,
    {
      user: { id: string; name: string; email: string }
      teamNames: Set<string>
      lastActivityAt: Date
      checkInCount: number
      initiativeCount: number
    }
  >()

  for (const m of membersInActiveTeams) {
    const uid = m.user.id
    if (!byUserId.has(uid)) {
      byUserId.set(uid, {
        user: m.user,
        teamNames: new Set(),
        lastActivityAt: new Date(0),
        checkInCount: 0,
        initiativeCount: 0,
      })
    }
    const row = byUserId.get(uid)!
    row.teamNames.add(m.team.name)
  }

  const userTeamIds = new Map<string, Set<string>>()
  for (const m of membersInActiveTeams) {
    if (!userTeamIds.has(m.userId)) userTeamIds.set(m.userId, new Set())
    userTeamIds.get(m.userId)!.add(m.teamId)
  }

  for (const c of checkIns) {
    const teamId = c.commitment.teamId
    const at = c.createdAt
    for (const [uid, row] of byUserId) {
      if (userTeamIds.get(uid)?.has(teamId)) {
        row.checkInCount += 1
        if (at > row.lastActivityAt) row.lastActivityAt = at
      }
    }
  }
  for (const i of initiatives) {
    const teamId = i.commitment.teamId
    const at = i.createdAt
    for (const [uid, row] of byUserId) {
      if (userTeamIds.get(uid)?.has(teamId)) {
        row.initiativeCount += 1
        if (at > row.lastActivityAt) row.lastActivityAt = at
      }
    }
  }

  return Array.from(byUserId.values())
    .map((row) => ({
      userId: row.user.id,
      name: row.user.name || row.user.email,
      email: row.user.email,
      teams: Array.from(row.teamNames).sort(),
      lastActivityAt: row.lastActivityAt,
      checkInCount: row.checkInCount,
      initiativeCount: row.initiativeCount,
    }))
    .sort(
      (a, b) =>
        b.lastActivityAt.getTime() - a.lastActivityAt.getTime()
    )
}

export interface CommitmentAdminRow {
  commitmentId: string
  ownerName: string | null
  email: string | null
  teamName: string
  commitmentTitle: string
  status: "ACTIVE" | "COMPLETED" | "ABANDONED"
  checkInCount: number
  initiativeCount: number
  lastActivityAt: Date
}

/**
 * One row per commitment for the admin “Team Commitments” table.
 *
 * - User / Email: OWNER of the team (if any)
 * - Team Name: team.name
 * - Commitment title: first objective title for this commitment
 * - Status: stored CommitmentStatus enum (ACTIVE / COMPLETED / ABANDONED)
 * - Number of check-ins: count of GripSession per commitment
 * - Number of initiatives: count of Initiative per commitment
 * - Last Activity: latest createdAt among check-ins and initiatives (or commitment.createdAt if none)
 *
 * Sorted by:
 * 1) ACTIVE first
 * 2) LastActivityAt ascending (oldest first)
 */
export async function getCommitmentAdminRows(): Promise<CommitmentAdminRow[]> {
  const rows = await db.$queryRaw<
    {
      commitmentId: string
      ownerName: string | null
      email: string | null
      teamName: string
      commitmentTitle: string
      status: "ACTIVE" | "COMPLETED" | "ABANDONED"
      checkInCount: bigint
      initiativeCount: bigint
      lastActivityAt: Date
    }[]
  >`
    SELECT
      c.id                            AS "commitmentId",
      u.name                          AS "ownerName",
      u.email                         AS "email",
      t.name                          AS "teamName",
      COALESCE(
        (SELECT o.title FROM "Objective" o WHERE o."commitmentId" = c.id ORDER BY o."sortOrder" ASC LIMIT 1),
        'Commitment'
      ) AS "commitmentTitle",
      c.status                        AS "status",
      COUNT(DISTINCT gs.id)::bigint   AS "checkInCount",
      COUNT(DISTINCT i.id)::bigint    AS "initiativeCount",
      COALESCE(
        GREATEST(
          COALESCE(MAX(gs."createdAt"), c."createdAt"),
          COALESCE(MAX(i."createdAt"), c."createdAt")
        ),
        c."createdAt"
      )                               AS "lastActivityAt"
    FROM "TeamCommitment" c
    JOIN "Team" t ON t.id = c."teamId"
    LEFT JOIN "TeamMember" tm
      ON tm."teamId" = c."teamId" AND tm."role" = 'OWNER'
    LEFT JOIN "User" u ON u.id = tm."userId"
    LEFT JOIN "GripSession" gs ON gs."commitmentId" = c.id
    LEFT JOIN "Initiative" i ON i."commitmentId" = c.id
    GROUP BY
      c.id,
      u.name,
      u.email,
      t.name,
      c.status,
      c."createdAt"
    ORDER BY
      CASE WHEN c.status = 'ACTIVE' THEN 0 ELSE 1 END ASC,
      "lastActivityAt" ASC
  `;

  return rows.map((row) => ({
    commitmentId: row.commitmentId,
    ownerName: row.ownerName,
    email: row.email,
    teamName: row.teamName,
    commitmentTitle: row.commitmentTitle,
    status: row.status,
    checkInCount: Number(row.checkInCount),
    initiativeCount: Number(row.initiativeCount),
    lastActivityAt: row.lastActivityAt,
  }))
}

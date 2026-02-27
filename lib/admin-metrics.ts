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

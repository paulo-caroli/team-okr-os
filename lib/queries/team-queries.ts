import { db } from "@/lib/db"
import type { TeamSummary, TeamMemberInfo } from "@/lib/domain/team"

export async function getTeamsForUser(userId: string): Promise<TeamSummary[]> {
  const memberships = await db.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          _count: { select: { members: true } },
          commitments: {
            where: { status: "ACTIVE" },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    memberCount: m.team._count.members,
    hasActiveCommitment: m.team.commitments.length > 0,
    createdAt: m.team.createdAt,
  }))
}

export async function getTeamMembers(teamId: string): Promise<TeamMemberInfo[]> {
  const members = await db.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  })

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    dedicationPct: m.dedicationPct,
    user: m.user,
    createdAt: m.createdAt,
  }))
}

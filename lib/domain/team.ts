export type TeamRole = "OWNER" | "MEMBER"

export interface TeamMemberInfo {
  id: string
  userId: string
  role: TeamRole
  dedicationPct: number | null
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
  createdAt: Date
}

export interface TeamSummary {
  id: string
  name: string
  memberCount: number
  hasActiveCommitment: boolean
  createdAt: Date
}

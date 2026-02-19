import { requireAuth } from "@/lib/auth-guard"
import { getTeamsForUser } from "@/lib/queries/team-queries"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import Link from "next/link"

export default async function TeamsPage() {
  const session = await requireAuth()
  const teams = await getTeamsForUser(session.user.id)

  if (teams.length === 0) {
    return (
      <div className="py-16">
        <EmptyState
          title="No teams yet"
          description="Create your first team to start operating around outcomes."
          action={
            <Link href="/team/new">
              <Button>Create your team</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Your teams
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Select a team or create a new one.
          </p>
        </div>
        <Link href="/team/new">
          <Button size="sm">New team</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {teams.map((team) => (
          <Link key={team.id} href={`/team/${team.id}`}>
            <Card className="flex items-center justify-between transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <div>
                <h2 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {team.name}
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                </p>
              </div>
              {team.hasActiveCommitment ? (
                <Badge variant="active">Active commitment</Badge>
              ) : (
                <Badge variant="default">No commitment</Badge>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

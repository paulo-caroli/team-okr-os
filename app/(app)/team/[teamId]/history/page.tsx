import { requireTeamAccess } from "@/lib/auth-guard"
import { getCommitmentHistory } from "@/lib/queries/commitment-queries"
import { objectiveProgressPercent } from "@/lib/domain/commitment"
import { EmptyState } from "@/components/ui/empty-state"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  await requireTeamAccess(teamId)

  const commitments = await getCommitmentHistory(teamId)

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Team OKR History
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Past Team OKR cycles and their objectives.
        </p>
      </div>

      {commitments.length === 0 ? (
        <EmptyState
          title="No completed cycles yet."
          description="When a Team OKR is completed or ended, it will appear here."
        />
      ) : (
        <div className="space-y-6">
          {commitments.map((c) => {
            const objective = c.objectives[0]
            const avgProgress = objective
              ? Math.round(objectiveProgressPercent(objective))
              : 0
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {objective?.title || "Team OKR"}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(c.cycle.startDate)} — {formatDate(c.cycle.endDate)}
                    </p>
                  </div>

                  <Badge variant={c.status === "COMPLETED" ? "completed" : "abandoned"}>
                    {c.status === "COMPLETED" ? "Completed" : "Ended"}
                  </Badge>
                </div>

                <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
                  Avg. objective progress (from key results): {avgProgress}%
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {c.checkInCount} check-in{c.checkInCount !== 1 ? "s" : ""} recorded
                  </span>

                  <Link
                    href={`/team/${teamId}/commitment/${c.id}`}
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    View details →
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

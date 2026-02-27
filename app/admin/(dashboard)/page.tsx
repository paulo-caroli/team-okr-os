import {
  getTotals,
  getTotalsLast7Days,
  getDailyCounts,
  getCommitmentAdminRows,
} from "@/lib/admin-metrics"
import { AdminCharts } from "./admin-charts"
import { TeamCommitmentsTable } from "./team-commitments-table"
import { Card } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const [totals, last7, checkInsByDay, signupsByDay, commitments] = await Promise.all([
    getTotals(),
    getTotalsLast7Days(),
    getDailyCounts({ model: "GripSession", days: 14 }),
    getDailyCounts({ model: "User", days: 14 }),
    getCommitmentAdminRows(),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Dashboard
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Total users
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {totals.users}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Total teams
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {totals.teams}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Total commitments
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {totals.commitments}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            +{last7.commitments} last 7 days
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Total check-ins
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {totals.checkIns}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            +{last7.checkIns} last 7 days
          </p>
        </Card>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Team Commitments
        </h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          One row per commitment, including owner, team, status, activity counts, and last activity.
        </p>
        <TeamCommitmentsTable rows={commitments} />
      </section>

      <AdminCharts
        checkInsByDay={checkInsByDay}
        signupsByDay={signupsByDay}
      />
    </div>
  )
}

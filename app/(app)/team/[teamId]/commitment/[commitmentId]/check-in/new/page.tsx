import { requireTeamAccess } from "@/lib/auth-guard"
import { getCommitment } from "@/lib/queries/commitment-queries"
import { getInitiatives } from "@/lib/queries/initiative-queries"
import { GripForm } from "@/components/check-in/grip-form"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function NewCheckInPage({
  params,
}: {
  params: Promise<{ teamId: string; commitmentId: string }>
}) {
  const { teamId, commitmentId } = await params
  await requireTeamAccess(teamId)

  const [commitment, initiatives] = await Promise.all([
    getCommitment(commitmentId),
    getInitiatives(commitmentId),
  ])
  if (!commitment || commitment.teamId !== teamId) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link
          href={`/team/${teamId}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
        >
          ← Back to Team OKR
        </Link>
        <h1 className="mt-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Impact Check-in (GRIP)
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          A structured conversation about impact. Not a status report.
        </p>
      </div>

      <GripForm
        commitmentId={commitmentId}
        teamId={teamId}
        objectives={commitment.objectives}
        initiatives={initiatives}
        cycleEndDate={commitment.cycle.endDate}
      />
    </div>
  )
}

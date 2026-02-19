import { requireTeamAccess } from "@/lib/auth-guard"
import { getCommitment } from "@/lib/queries/commitment-queries"
import { getInitiatives } from "@/lib/queries/initiative-queries"
import { getCheckIns } from "@/lib/queries/check-in-queries"
import { CommitmentOverview } from "@/components/commitment/commitment-overview"
import { redirect, notFound } from "next/navigation"

export default async function CommitmentPage({
  params,
}: {
  params: Promise<{ teamId: string; commitmentId: string }>
}) {
  const { teamId, commitmentId } = await params
  await requireTeamAccess(teamId)

  const commitment = await getCommitment(commitmentId)
  if (!commitment || commitment.teamId !== teamId) notFound()

  if (commitment.status === "ACTIVE") {
    redirect(`/team/${teamId}`)
  }

  const [initiatives, checkIns] = await Promise.all([
    getInitiatives(commitmentId),
    getCheckIns(commitmentId),
  ])

  return (
    <CommitmentOverview
      commitment={commitment}
      initiatives={initiatives}
      checkIns={checkIns}
      teamId={teamId}
    />
  )
}

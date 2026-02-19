import { requireTeamAccess } from "@/lib/auth-guard"
import { getActiveCommitment, getLastInactiveCommitment } from "@/lib/queries/commitment-queries"
import { getInitiatives } from "@/lib/queries/initiative-queries"
import { getCheckIns } from "@/lib/queries/check-in-queries"
import { CommitmentOverview } from "@/components/commitment/commitment-overview"
import { NoActiveCommitment } from "@/components/commitment/no-active-commitment"

export default async function TeamHubPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  await requireTeamAccess(teamId)

  const commitment = await getActiveCommitment(teamId)

  if (!commitment) {
    const lastInactive = await getLastInactiveCommitment(teamId)
    return (
      <NoActiveCommitment
        teamId={teamId}
        lastCommitment={lastInactive}
      />
    )
  }

  const [initiatives, checkIns] = await Promise.all([
    getInitiatives(commitment.id),
    getCheckIns(commitment.id),
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

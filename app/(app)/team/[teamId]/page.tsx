import { requireTeamAccess } from "@/lib/auth-guard"
import { getActiveTeamOkrs, getLastInactiveCommitment } from "@/lib/queries/commitment-queries"
import { getInitiatives } from "@/lib/queries/initiative-queries"
import { getCheckIns } from "@/lib/queries/check-in-queries"
import { CommitmentOverview } from "@/components/commitment/commitment-overview"
import { NoActiveCommitment } from "@/components/commitment/no-active-commitment"
import { CreateTeamOkrButton } from "@/components/commitment/create-team-okr-button"

export default async function TeamHubPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  await requireTeamAccess(teamId)

  const activeOkrs = await getActiveTeamOkrs(teamId)

  if (activeOkrs.length === 0) {
    const lastInactive = await getLastInactiveCommitment(teamId)
    return (
      <NoActiveCommitment
        teamId={teamId}
        lastCommitment={lastInactive}
      />
    )
  }

  const blocks = await Promise.all(
    activeOkrs.map(async (commitment) => ({
      commitment,
      initiatives: await getInitiatives(commitment.id),
      checkIns: await getCheckIns(commitment.id),
    }))
  )

  return (
    <div className="space-y-16">
      <div className="flex justify-end">
        <CreateTeamOkrButton
          teamId={teamId}
          hasActiveOkr={activeOkrs.length > 0}
        />
      </div>

      {blocks.map(({ commitment, initiatives, checkIns }, index) => (
        <div
          key={commitment.id}
          className={index > 0 ? "border-t border-zinc-200 pt-16 dark:border-zinc-800" : ""}
        >
          <CommitmentOverview
            commitment={commitment}
            initiatives={initiatives}
            checkIns={checkIns}
            teamId={teamId}
          />
        </div>
      ))}
    </div>
  )
}

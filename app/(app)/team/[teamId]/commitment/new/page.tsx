import { requireTeamAccess } from "@/lib/auth-guard"
import { getTeamMembers } from "@/lib/queries/team-queries"
import { CommitmentCreationForm } from "@/components/commitment/commitment-creation-form"
import { db } from "@/lib/db"
import { Card } from "@/components/ui/card"

export interface CommitmentPrefill {
  strategicIntent: string
  primaryOutcomeStatement: string | null
  primaryMetric: string
  primaryBaseline: number | null
  primaryCurrent: number
  signals: Array<{
    statement: string | null
    metric: string
    baseline: number | null
    current: number
  }>
  initiatives: Array<{
    name: string
    hypothesis: string
  }>
  previousCurrentValue: number
}

export default async function NewCommitmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>
  searchParams: Promise<{ cloneFrom?: string }>
}) {
  const { teamId } = await params
  const { cloneFrom } = await searchParams
  await requireTeamAccess(teamId)

  const [team, members] = await Promise.all([
    db.team.findUnique({ where: { id: teamId } }),
    getTeamMembers(teamId),
  ])

  const pendingInvitations = await db.teamInvitation.findMany({
    where: { teamId, status: "PENDING" },
    select: { name: true, email: true },
  })

  let prefill: CommitmentPrefill | null = null

  if (cloneFrom) {
    const previous = await db.teamCommitment.findUnique({
      where: { id: cloneFrom },
      include: {
        supportingSignals: { orderBy: { order: "asc" } },
        initiatives: { select: { name: true, hypothesis: true } },
      },
    })

    if (previous && previous.teamId === teamId && previous.status !== "ACTIVE") {
      prefill = {
        strategicIntent: previous.strategicIntent,
        primaryOutcomeStatement: previous.primaryOutcomeStatement,
        primaryMetric: previous.primaryMetric,
        primaryBaseline: previous.primaryCurrent,
        primaryCurrent: previous.primaryCurrent,
        signals: previous.supportingSignals.map((s) => ({
          statement: s.statement,
          metric: s.metric,
          baseline: s.current,
          current: s.current,
        })),
        initiatives: previous.initiatives.map((i) => ({
          name: i.name,
          hypothesis: i.hypothesis,
        })),
        previousCurrentValue: previous.primaryCurrent,
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Create team commitment
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          A commitment is made <strong className="text-zinc-700 dark:text-zinc-300">by the team, for the team</strong>.
          It is not cascaded from above. The people listed below should
          participate in defining what this team commits to move.
        </p>
      </div>

      {/* Team roster reminder */}
      <Card className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          This commitment is made by
        </p>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {m.user.name.charAt(0).toUpperCase()}
              </span>
              {m.user.name}
              {m.dedicationPct != null && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {m.dedicationPct}% committed
                </span>
              )}
            </span>
          ))}
          {pendingInvitations.map((inv) => (
            <span
              key={inv.email}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-300 px-3 py-1 text-sm text-zinc-400 dark:border-zinc-600 dark:text-zinc-500"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-zinc-300 text-xs dark:border-zinc-600">
                ?
              </span>
              {inv.name || inv.email}
              <span className="text-xs">(pending)</span>
            </span>
          ))}
        </div>
      </Card>

      <CommitmentCreationForm teamId={teamId} prefill={prefill} />
    </div>
  )
}

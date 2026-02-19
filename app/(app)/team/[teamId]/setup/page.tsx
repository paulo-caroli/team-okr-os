import { requireTeamAccess } from "@/lib/auth-guard"
import { getTeamMembers } from "@/lib/queries/team-queries"
import { db } from "@/lib/db"
import { MemberList } from "@/components/team/member-list"
import { PendingInvitations } from "@/components/team/pending-invitations"
import { SetupInviteForm } from "@/components/team/setup-invite-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function TeamSetupPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const { member } = await requireTeamAccess(teamId)

  const team = await db.team.findUnique({ where: { id: teamId } })
  if (!team) return null

  const members = await getTeamMembers(teamId)
  const isOwner = member.role === "OWNER"

  const pendingInvitations = await db.teamInvitation.findMany({
    where: { teamId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-10">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Who is on {team.name}?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          List the people who are part of this team. Every person listed here
          will be able to view and edit all team commitments, initiatives, and
          check-ins when they sign in with their email.
        </p>
      </div>

      {/* Current members */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Team members
        </h2>
        <MemberList members={members} teamId={teamId} isOwner={isOwner} />
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mb-8">
          <PendingInvitations
            invitations={pendingInvitations}
            teamId={teamId}
            isOwner={isOwner}
          />
        </div>
      )}

      {/* Add member form */}
      <div className="mb-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Add a team member
        </h2>
        <p className="mb-4 text-sm text-zinc-400 dark:text-zinc-500">
          If they already have an account, they will be added immediately.
          Otherwise, an invitation will be created and they will join
          automatically when they sign up with that email.
        </p>
        <SetupInviteForm teamId={teamId} />
      </div>

      {/* Continue */}
      <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Link href={`/team/${teamId}`}>
            <Button size="lg">Continue to team</Button>
          </Link>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            You can always add or remove members later via Edit team.
          </p>
        </div>
      </div>
    </div>
  )
}

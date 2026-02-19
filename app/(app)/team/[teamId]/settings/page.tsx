import { requireTeamAccess } from "@/lib/auth-guard"
import { getTeamMembers } from "@/lib/queries/team-queries"
import { db } from "@/lib/db"
import { TeamSettingsForm } from "@/components/team/team-settings-form"
import { MemberList } from "@/components/team/member-list"
import { InviteMemberForm } from "@/components/team/invite-member-form"
import { PendingInvitations } from "@/components/team/pending-invitations"

export default async function TeamSettingsPage({
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
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Team settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage the team name and members.
        </p>
      </div>

      {/* Team name */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Team name
        </h2>
        <TeamSettingsForm teamId={teamId} teamName={team.name} />
      </div>

      {/* Current members */}
      <div className="border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Team members
        </h2>
        <MemberList
          members={members}
          teamId={teamId}
          isOwner={isOwner}
        />
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="border-t border-zinc-200 pt-10 dark:border-zinc-800">
          <PendingInvitations
            invitations={pendingInvitations}
            teamId={teamId}
            isOwner={isOwner}
          />
        </div>
      )}

      {/* Add member */}
      <div className="border-t border-zinc-200 pt-10 dark:border-zinc-800">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Add a team member
        </h2>
        <p className="mb-4 text-sm text-zinc-400 dark:text-zinc-500">
          If they already have an account, they will be added immediately.
          Otherwise, an invitation will be created and they will join
          automatically when they sign up with that email.
        </p>
        <InviteMemberForm teamId={teamId} />
      </div>
    </div>
  )
}

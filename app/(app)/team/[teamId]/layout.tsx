import { requireTeamAccess } from "@/lib/auth-guard"
import { TeamNav } from "@/components/team/team-nav"

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const { member } = await requireTeamAccess(teamId)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {member.team.name}
        </h1>
        <TeamNav teamId={teamId} />
      </div>
      {children}
    </div>
  )
}

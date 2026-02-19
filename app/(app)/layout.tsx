import { requireAuth } from "@/lib/auth-guard"
import { db } from "@/lib/db"
import { AppNav } from "@/components/team/app-nav"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  const memberships = await db.teamMember.findMany({
    where: { userId: session.user.id },
    include: { team: true },
    orderBy: { createdAt: "desc" },
  })

  const teams = memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
  }))

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppNav
        userName={session.user.name || "User"}
        teams={teams}
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

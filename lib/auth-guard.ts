import { auth } from "./auth"
import { redirect } from "next/navigation"
import { db } from "./db"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/sign-in")
  }
  return session
}

export async function requireTeamAccess(teamId: string) {
  const session = await requireAuth()

  const member = await db.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: session.user.id },
    },
    include: { team: true },
  })

  if (!member) {
    redirect("/team")
  }

  return { session, member }
}

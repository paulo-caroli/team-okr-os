"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { sendInvitationEmail } from "@/lib/email"
import { headers } from "next/headers"

export type ActionState = { error: string; success?: never } | null

export type InviteState =
  | { error: string; success?: never; invited?: never }
  | { success: true; invited: "existing" | "pending"; email: string; name: string | null; teamName: string; error?: never }
  | null

export async function createTeam(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const name = (formData.get("name") as string)?.trim()
  if (!name) return { error: "Team name is required." }

  const rawDedication = (formData.get("dedicationPct") as string)?.trim()
  if (!rawDedication) return { error: "Your dedication percentage is required." }
  const dedicationPct = parseInt(rawDedication)
  if (isNaN(dedicationPct) || dedicationPct < 0 || dedicationPct > 100) {
    return { error: "Dedication must be a number between 0 and 100." }
  }

  const team = await db.team.create({
    data: {
      name,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
          dedicationPct,
        },
      },
    },
  })

  redirect(`/team/${team.id}/setup`)
}

export async function updateTeam(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const teamId = formData.get("teamId") as string
  const name = (formData.get("name") as string)?.trim()

  if (!name) return { error: "Team name is required." }

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (!member) return { error: "You are not a member of this team." }

  await db.team.update({
    where: { id: teamId },
    data: { name },
  })

  revalidatePath(`/team/${teamId}`)
  return null
}

export async function addTeamMember(
  prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const teamId = formData.get("teamId") as string
  const name = (formData.get("name") as string)?.trim() || null
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const dedicationPct = formData.get("dedicationPct")
    ? parseInt(formData.get("dedicationPct") as string)
    : null

  if (!email) return { error: "Email is required." }

  const currentMember = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (!currentMember) return { error: "You are not a member of this team." }

  const team = await db.team.findUnique({ where: { id: teamId } })
  if (!team) return { error: "Team not found." }

  // If user already exists, add them directly
  const user = await db.user.findUnique({ where: { email } })

  if (user) {
    const existing = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: user.id } },
    })
    if (existing) return { error: "This person is already a team member." }

    await db.teamMember.create({
      data: {
        teamId,
        userId: user.id,
        role: "MEMBER",
        dedicationPct,
      },
    })

    revalidatePath(`/team/${teamId}/settings`)
    revalidatePath(`/team/${teamId}/setup`)
    return { success: true, invited: "existing", email, name: user.name, teamName: team.name }
  }

  // User doesn't exist — create a pending invitation
  const existingInvite = await db.teamInvitation.findUnique({
    where: { teamId_email: { teamId, email } },
  })

  if (existingInvite && existingInvite.status === "PENDING") {
    return { error: "An invitation for this email is already pending." }
  }

  if (existingInvite) {
    await db.teamInvitation.update({
      where: { id: existingInvite.id },
      data: {
        status: "PENDING",
        name,
        dedicationPct,
        invitedById: session.user.id,
      },
    })
  } else {
    await db.teamInvitation.create({
      data: {
        teamId,
        name,
        email,
        dedicationPct,
        invitedById: session.user.id,
      },
    })
  }

  // Send invitation email (non-blocking, graceful if not configured)
  const headersList = await headers()
  const host = headersList.get("host") || "localhost:3000"
  const protocol = headersList.get("x-forwarded-proto") || "http"
  const signUpUrl = `${protocol}://${host}/sign-up`

  const inviterName = session.user.name || "A teammate"

  await sendInvitationEmail({
    to: email,
    teamName: team.name,
    inviterName,
    signUpUrl,
  })

  revalidatePath(`/team/${teamId}/settings`)
  revalidatePath(`/team/${teamId}/setup`)
  return { success: true, invited: "pending", email, name, teamName: team.name }
}

export async function cancelInvitation(teamId: string, invitationId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (!member) return

  await db.teamInvitation.update({
    where: { id: invitationId },
    data: { status: "CANCELLED" },
  })

  revalidatePath(`/team/${teamId}/settings`)
}

export async function removeTeamMember(teamId: string, memberId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const currentMember = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (currentMember?.role !== "OWNER") return

  const target = await db.teamMember.findUnique({ where: { id: memberId } })
  if (!target || target.teamId !== teamId) return
  if (target.userId === session.user.id) return

  await db.teamMember.delete({ where: { id: memberId } })
  revalidatePath(`/team/${teamId}/settings`)
}

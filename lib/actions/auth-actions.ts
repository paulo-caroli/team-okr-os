"use server"

import { signIn, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { trackEvent } from "@/lib/analytics"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"

export type AuthState = { error: string } | null

/**
 * Accept any pending team invitations for a user.
 * Called on both sign-up and sign-in so that invitations
 * are never silently lost.
 */
async function acceptPendingInvitations(userId: string, email: string) {
  const pendingInvitations = await db.teamInvitation.findMany({
    where: { email: email.toLowerCase(), status: "PENDING" },
  })

  for (const invitation of pendingInvitations) {
    const alreadyMember = await db.teamMember.findUnique({
      where: {
        teamId_userId: { teamId: invitation.teamId, userId },
      },
    })

    if (!alreadyMember) {
      await db.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: "MEMBER",
          dedicationPct: invitation.dedicationPct,
        },
      })
    }

    await db.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    })
  }
}

export async function signInAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  // Process any pending invitations before signing in
  const user = await db.user.findUnique({ where: { email } })
  if (user) {
    await acceptPendingInvitations(user.id, email)
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/team",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." }
    }
    throw error
  }
  return null
}

export async function signUpAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string

  if (!name || !email || !password) {
    return { error: "All fields are required." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "An account with this email already exists." }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const newUser = await db.user.create({
    data: { name, email, passwordHash },
  })

  trackEvent({ userId: newUser.id, event: "user_signed_up" })

  // Auto-accept any pending team invitations for this email
  await acceptPendingInvitations(newUser.id, email)

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/team",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created. Please sign in." }
    }
    throw error
  }

  return null
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}

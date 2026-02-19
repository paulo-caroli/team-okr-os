"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export type ActionState = { error: string; success?: never } | { success: true; error?: never; initiative?: { id: string; name: string; hypothesis: string; expectedImpact: unknown; status: string; conclusionReason: string | null; conclusionImpact: string | null } } | null

export async function createInitiative(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const commitmentId = formData.get("commitmentId") as string
  const teamId = formData.get("teamId") as string
  const name = (formData.get("name") as string)?.trim()
  const hypothesis = (formData.get("hypothesis") as string)?.trim()

  if (!name) return { error: "Initiative name is required." }
  if (!hypothesis) return { error: "Please explain why you believe this initiative will influence the Primary Outcome." }

  const impactPrimary = formData.get("impactPrimary") === "true"
  const impactSignalIdsRaw = (formData.get("impactSignalIds") as string)?.trim()
  const impactSignalIds = impactSignalIdsRaw
    ? impactSignalIdsRaw.split(",").filter(Boolean)
    : []

  const hasImpact = impactPrimary || impactSignalIds.length > 0
  const expectedImpact = hasImpact
    ? { primary: impactPrimary, signalIds: impactSignalIds }
    : null

  const initiative = await db.initiative.create({
    data: {
      commitmentId,
      name,
      hypothesis,
      expectedImpact: expectedImpact ?? undefined,
    },
  })

  revalidatePath(`/team/${teamId}`)
  revalidatePath(`/team/${teamId}/commitment/${commitmentId}`)

  return {
    success: true,
    initiative: {
      id: initiative.id,
      name: initiative.name,
      hypothesis: initiative.hypothesis,
      expectedImpact: initiative.expectedImpact,
      status: initiative.status,
      conclusionReason: initiative.conclusionReason,
      conclusionImpact: initiative.conclusionImpact,
    },
  }
}

export async function concludeInitiative(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const initiativeId = formData.get("initiativeId") as string
  const teamId = formData.get("teamId") as string
  const conclusionReason = (formData.get("conclusionReason") as string)?.trim()
  const conclusionImpact = (formData.get("conclusionImpact") as string)?.trim() || null

  if (!conclusionReason || conclusionReason.length < 10) {
    return { error: "Please provide a reason for concluding this initiative (at least 10 characters)." }
  }

  const initiative = await db.initiative.update({
    where: { id: initiativeId },
    data: {
      status: "CONCLUDED",
      conclusionReason,
      conclusionImpact,
    },
    select: { commitmentId: true },
  })

  revalidatePath(`/team/${teamId}`)
  revalidatePath(`/team/${teamId}/commitment/${initiative.commitmentId}`)
  return { success: true }
}

export async function reactivateInitiative(
  initiativeId: string,
  teamId: string
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const initiative = await db.initiative.update({
    where: { id: initiativeId },
    data: {
      status: "ACTIVE",
      conclusionReason: null,
      conclusionImpact: null,
    },
    select: { commitmentId: true },
  })

  revalidatePath(`/team/${teamId}`)
  revalidatePath(`/team/${teamId}/commitment/${initiative.commitmentId}`)
}

export async function updateInitiative(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const initiativeId = formData.get("initiativeId") as string
  const teamId = formData.get("teamId") as string
  const name = (formData.get("name") as string)?.trim()
  const hypothesis = (formData.get("hypothesis") as string)?.trim()

  if (!name) return { error: "Initiative name is required." }
  if (!hypothesis) return { error: "Please explain why you believe this initiative will influence the Primary Outcome." }

  const impactPrimary = formData.get("impactPrimary") === "true"
  const impactSignalIdsRaw = (formData.get("impactSignalIds") as string)?.trim()
  const impactSignalIds = impactSignalIdsRaw
    ? impactSignalIdsRaw.split(",").filter(Boolean)
    : []

  const hasImpact = impactPrimary || impactSignalIds.length > 0
  const expectedImpact = hasImpact
    ? { primary: impactPrimary, signalIds: impactSignalIds }
    : null

  const initiative = await db.initiative.update({
    where: { id: initiativeId },
    data: {
      name,
      hypothesis,
      expectedImpact: expectedImpact ?? undefined,
    },
    select: { commitmentId: true },
  })

  revalidatePath(`/team/${teamId}`)
  revalidatePath(`/team/${teamId}/commitment/${initiative.commitmentId}`)
  return { success: true }
}

export async function deleteInitiative(
  initiativeId: string,
  teamId: string
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const initiative = await db.initiative.delete({
    where: { id: initiativeId },
    select: { commitmentId: true },
  })

  revalidatePath(`/team/${teamId}`)
  revalidatePath(`/team/${teamId}/commitment/${initiative.commitmentId}`)
}

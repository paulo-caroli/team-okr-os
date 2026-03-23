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

  console.info("[createInitiative] start", { teamId, commitmentId })

  if (!name) {
    console.info("[createInitiative] validation_error", { code: "name", teamId, commitmentId })
    return { error: "Initiative name is required." }
  }
  if (!hypothesis) {
    console.info("[createInitiative] validation_error", { code: "hypothesis", teamId, commitmentId })
    return { error: "Please explain why you believe this initiative will influence your team objectives." }
  }

  const impactKeyResultIdsRaw = (formData.get("impactKeyResultIds") as string)?.trim()
  const impactKeyResultIds = impactKeyResultIdsRaw
    ? impactKeyResultIdsRaw.split(",").filter(Boolean)
    : []

  const hasImpact = impactKeyResultIds.length > 0
  const expectedImpact = hasImpact ? { keyResultIds: impactKeyResultIds } : null

  try {
    const initiative = await db.initiative.create({
      data: {
        commitmentId,
        name,
        hypothesis,
        expectedImpact: expectedImpact ?? undefined,
      },
    })

    try {
      revalidatePath(`/team/${teamId}`)
      revalidatePath(`/team/${teamId}/commitment/${commitmentId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("[createInitiative] revalidate failure", {
        teamId,
        commitmentId,
        initiativeId: initiative.id,
        error: message,
      })
    }

    console.info("[createInitiative] success", {
      teamId,
      commitmentId,
      initiativeId: initiative.id,
    })

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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[createInitiative] error", { teamId, commitmentId, error: message })
    return { error: "Could not create initiative. Please try again." }
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
  if (!hypothesis) {
    return { error: "Please explain why you believe this initiative will influence your team objectives." }
  }

  const impactKeyResultIdsRaw = (formData.get("impactKeyResultIds") as string)?.trim()
  const impactKeyResultIds = impactKeyResultIdsRaw
    ? impactKeyResultIdsRaw.split(",").filter(Boolean)
    : []

  const hasImpact = impactKeyResultIds.length > 0
  const expectedImpact = hasImpact ? { keyResultIds: impactKeyResultIds } : null

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

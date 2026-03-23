"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { trackEvent } from "@/lib/analytics"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import type { Confidence } from "@/lib/domain/check-in"

export type ActionState = { error: string } | null

function normalizeConfidence(raw: FormDataEntryValue | null): Confidence {
  const s = typeof raw === "string" ? raw.trim() : ""
  if (s === "HIGH" || s === "MEDIUM" || s === "LOW") return s
  return "MEDIUM"
}

export async function createCheckIn(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const commitmentId = formData.get("commitmentId") as string
  const teamId = formData.get("teamId") as string

  console.info("[createCheckIn] start", { teamId, commitmentId })

  const confidence = normalizeConfidence(formData.get("confidence"))

  const confidenceReason = (formData.get("confidenceReason") as string)?.trim() || null

  const occurredDateStr = ((formData.get("occurredDate") as string) ?? "").trim()
  const occurredTimeStr = ((formData.get("occurredTime") as string) ?? "").trim()
  const now = new Date()
  const fallbackDate = now.toISOString().slice(0, 10)
  const fallbackTime = now.toTimeString().slice(0, 5)
  const datePart = occurredDateStr || fallbackDate
  const timePart = occurredTimeStr || fallbackTime
  let occurredAt = new Date(`${datePart}T${timePart}`)
  if (!Number.isFinite(occurredAt.getTime())) {
    occurredAt = new Date()
  }

  const keyResults = await db.keyResult.findMany({
    where: { objective: { commitmentId } },
    select: { id: true, current: true },
  })

  if (keyResults.length === 0) {
    console.error("[createCheckIn] no_key_results", { commitmentId, teamId })
    return { error: "Could not save this check-in. Please try again." }
  }

  const currentById = new Map(keyResults.map((k) => [k.id, k.current]))

  const resultsReflection =
    (formData.get("resultsReflection") as string)?.trim() || "(Not provided)"

  const initiativeReflection = (formData.get("initiativeReflection") as string)?.trim() || null
  const issues = (formData.get("issues") as string)?.trim() || ""
  const planForward = (formData.get("planForward") as string)?.trim() || ""

  const snapshots: Record<string, number> = {}
  const krIds = formData.getAll("keyResultIds") as string[]

  for (const krId of krIds) {
    const existingCurrent = currentById.get(krId)
    if (existingCurrent === undefined) {
      continue
    }
    const raw = formData.get(`kr_${krId}`)
    const valueStr = typeof raw === "string" ? raw.trim() : ""
    const parsed = parseFloat(valueStr)
    snapshots[krId] = Number.isFinite(parsed) ? parsed : existingCurrent
  }

  let checkIn: Awaited<ReturnType<typeof db.gripSession.create>>
  try {
    checkIn = await db.$transaction(async (tx) => {
      for (const [krId, value] of Object.entries(snapshots)) {
        await tx.keyResult.update({
          where: { id: krId },
          data: { current: value },
        })
      }

      return tx.gripSession.create({
        data: {
          commitmentId,
          occurredAt,
          confidence,
          confidenceReason,
          keyResultSnapshots: snapshots,
          resultsReflection,
          initiativeReflection,
          issues,
          planForward,
        },
      })
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[createCheckIn] transaction_failed", { teamId, commitmentId, error: message })
    return { error: "Could not save this check-in. Please try again." }
  }

  console.info("[createCheckIn] transaction committed", {
    teamId,
    commitmentId,
    checkInId: checkIn.id,
  })

  try {
    trackEvent({
      userId: session.user.id,
      event: "checkin_created",
      properties: { teamId, commitmentId, checkInId: checkIn.id, confidence },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[createCheckIn] post-commit analytics failure", { error: message, checkInId: checkIn.id })
  }

  try {
    revalidatePath(`/team/${teamId}`)
    revalidatePath(`/team/${teamId}/commitment/${commitmentId}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[createCheckIn] post-commit revalidate failure", { error: message, checkInId: checkIn.id })
  }

  console.info("[createCheckIn] redirect", {
    teamId,
    commitmentId,
    checkInId: checkIn.id,
  })

  redirect(`/team/${teamId}/commitment/${commitmentId}/check-in/${checkIn.id}`)
}

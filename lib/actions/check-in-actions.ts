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

  const commitment = await db.teamCommitment.findUnique({
    where: { id: commitmentId },
    select: {
      primaryCurrent: true,
      supportingSignals: { select: { id: true, current: true } },
    },
  })

  if (!commitment) {
    console.error("[createCheckIn] commitment_not_found", { commitmentId, teamId })
    return { error: "Could not save this check-in. Please try again." }
  }

  const signalCurrentById = new Map(
    commitment.supportingSignals.map((s) => [s.id, s.current])
  )

  const primaryRaw = formData.get("primaryOutcomeSnapshot")
  const primaryStr = typeof primaryRaw === "string" ? primaryRaw.trim() : ""
  const parsedPrimary = parseFloat(primaryStr)
  const primaryOutcomeSnapshot = Number.isFinite(parsedPrimary)
    ? parsedPrimary
    : commitment.primaryCurrent

  const resultsReflection =
    (formData.get("resultsReflection") as string)?.trim() || "(Not provided)"

  const initiativeReflection = (formData.get("initiativeReflection") as string)?.trim() || null
  const issues = (formData.get("issues") as string)?.trim() || ""
  const planForward = (formData.get("planForward") as string)?.trim() || ""

  const signalSnapshots: Record<string, number> = {}
  const signalIds = formData.getAll("signalIds") as string[]

  for (const signalId of signalIds) {
    const existingCurrent = signalCurrentById.get(signalId)
    if (existingCurrent === undefined) {
      continue
    }
    const raw = formData.get(`signal_${signalId}`)
    const valueStr = typeof raw === "string" ? raw.trim() : ""
    const parsed = parseFloat(valueStr)
    signalSnapshots[signalId] = Number.isFinite(parsed) ? parsed : existingCurrent
  }

  let checkIn: Awaited<ReturnType<typeof db.gripSession.create>>
  try {
    checkIn = await db.$transaction(async (tx) => {
      await tx.teamCommitment.update({
        where: { id: commitmentId },
        data: { primaryCurrent: primaryOutcomeSnapshot },
      })

      for (const [signalId, value] of Object.entries(signalSnapshots)) {
        await tx.supportingSignal.update({
          where: { id: signalId },
          data: { current: value },
        })
      }

      return tx.gripSession.create({
        data: {
          commitmentId,
          occurredAt,
          confidence,
          confidenceReason,
          primaryOutcomeSnapshot,
          resultsReflection,
          initiativeReflection,
          issues,
          planForward,
          supportingSignalSnapshots:
            Object.keys(signalSnapshots).length > 0 ? signalSnapshots : undefined,
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

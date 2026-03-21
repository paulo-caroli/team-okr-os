"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { trackEvent } from "@/lib/analytics"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import type { Confidence } from "@/lib/domain/check-in"

export type ActionState = { error: string } | null

export async function createCheckIn(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const commitmentId = formData.get("commitmentId") as string
  const teamId = formData.get("teamId") as string

  console.info("[createCheckIn] start", { teamId, commitmentId })

  const occurredDateStr = formData.get("occurredDate") as string
  const occurredTimeStr = formData.get("occurredTime") as string
  const confidence = formData.get("confidence") as Confidence
  const confidenceReason = (formData.get("confidenceReason") as string)?.trim() || null
  const primaryOutcomeSnapshotStr = formData.get("primaryOutcomeSnapshot") as string
  const resultsReflection = (formData.get("resultsReflection") as string)?.trim()
  const initiativeReflection = (formData.get("initiativeReflection") as string)?.trim() || null
  const issues = (formData.get("issues") as string)?.trim() || ""
  const planForward = (formData.get("planForward") as string)?.trim() || ""

  if (!occurredDateStr) {
    console.info("[createCheckIn] validation_error", { code: "no_date", teamId, commitmentId })
    return { error: "Please select a check-in date." }
  }
  if (!confidence || !["HIGH", "MEDIUM", "LOW"].includes(confidence)) {
    console.info("[createCheckIn] validation_error", { code: "confidence", teamId, commitmentId })
    return { error: "Please select a confidence level." }
  }

  const primaryOutcomeSnapshot = parseFloat(primaryOutcomeSnapshotStr)
  if (isNaN(primaryOutcomeSnapshot)) {
    console.info("[createCheckIn] validation_error", { code: "primary_snapshot", teamId, commitmentId })
    return { error: "Primary Outcome current value must be a number." }
  }

  if (!resultsReflection) {
    console.info("[createCheckIn] validation_error", { code: "results_reflection", teamId, commitmentId })
    return { error: "Please describe the current status of the Primary Outcome." }
  }

  const occurredAt = occurredTimeStr
    ? new Date(`${occurredDateStr}T${occurredTimeStr}`)
    : new Date(occurredDateStr)

  if (!Number.isFinite(occurredAt.getTime())) {
    console.info("[createCheckIn] validation_error", { code: "invalid_datetime", teamId, commitmentId })
    return {
      error: "Invalid date or time. Please check the date and time fields.",
    }
  }

  // Build supporting signal snapshots from form data
  const signalSnapshots: Record<string, number> = {}
  const signalIds = formData.getAll("signalIds") as string[]

  for (const signalId of signalIds) {
    const valueStr = (formData.get(`signal_${signalId}`) as string)?.trim()
    if (!valueStr) {
      console.info("[createCheckIn] validation_error", { code: "signal_value", teamId, commitmentId })
      return { error: "All supporting signal values are required." }
    }
    const value = parseFloat(valueStr)
    if (isNaN(value)) {
      console.info("[createCheckIn] validation_error", { code: "signal_nan", teamId, commitmentId })
      return { error: "All supporting signal values must be valid numbers." }
    }
    signalSnapshots[signalId] = value
  }

  // Create the GripSession and update current values in a transaction
  let checkIn: Awaited<ReturnType<typeof db.gripSession.create>>
  try {
    checkIn = await db.$transaction(async (tx) => {
    // 1. Update PrimaryOutcome.current
    await tx.teamCommitment.update({
      where: { id: commitmentId },
      data: { primaryCurrent: primaryOutcomeSnapshot },
    })

    // 2. Update each SupportingSignal.current
    for (const [signalId, value] of Object.entries(signalSnapshots)) {
      await tx.supportingSignal.update({
        where: { id: signalId },
        data: { current: value },
      })
    }

    // 3. Create GripSession with snapshot values
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

"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { trackEvent } from "@/lib/analytics"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export type ActionState = { error: string } | null

function parseOptionalFloat(value: string | null): number | null {
  if (!value) return null
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

function parseRequiredFloat(value: string | null): number | null {
  if (!value) return null
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

export async function createCommitment(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const teamId = formData.get("teamId") as string
  const strategicIntent = (formData.get("strategicIntent") as string)?.trim()
  const primaryOutcomeStatement = (formData.get("primaryOutcomeStatement") as string)?.trim() || null
  const primaryMetric = (formData.get("primaryMetric") as string)?.trim()
  const primaryBaseline = parseOptionalFloat((formData.get("primaryBaseline") as string)?.trim() || null)
  const primaryTarget = parseRequiredFloat((formData.get("primaryTarget") as string)?.trim() || null)
  const primaryCurrent = parseRequiredFloat((formData.get("primaryCurrent") as string)?.trim() || null)
  const cycleLabel = (formData.get("cycleLabel") as string)?.trim() || null
  const cycleStartDate = formData.get("cycleStartDate") as string
  const cycleEndDate = formData.get("cycleEndDate") as string

  if (!strategicIntent) return { error: "Strategic intent is required." }
  if (!primaryMetric) return { error: "Primary outcome metric is required." }
  if (primaryTarget === null) return { error: "Primary outcome target is required and must be a number." }
  if (primaryCurrent === null) return { error: "Primary outcome current value is required and must be a number." }
  if (!cycleStartDate || !cycleEndDate) return { error: "Cycle dates are required." }

  const start = new Date(cycleStartDate)
  const end = new Date(cycleEndDate)
  if (end <= start) return { error: "End date must be after start date." }

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (!member) return { error: "You are not a member of this team." }

  const existing = await db.teamCommitment.findFirst({
    where: { teamId, status: "ACTIVE" },
  })
  if (existing) {
    return { error: "This team already has an active commitment. Complete or abandon it first." }
  }

  const signals: Array<{ statement: string | null; metric: string; baseline: number | null; target: number; current: number }> = []
  for (let i = 0; i < 5; i++) {
    const metric = (formData.get(`signal_${i}_metric`) as string)?.trim()
    if (metric) {
      const statement = (formData.get(`signal_${i}_statement`) as string)?.trim() || null
      const target = parseRequiredFloat((formData.get(`signal_${i}_target`) as string)?.trim() || null)
      const current = parseRequiredFloat((formData.get(`signal_${i}_current`) as string)?.trim() || null)
      if (target === null) {
        return { error: `Signal ${i + 1}: target is required and must be a number.` }
      }
      if (current === null) {
        return { error: `Signal ${i + 1}: current value is required and must be a number.` }
      }
      signals.push({
        statement,
        metric,
        baseline: parseOptionalFloat((formData.get(`signal_${i}_baseline`) as string)?.trim() || null),
        target,
        current,
      })
    }
  }

  // Collect initiatives to clone (if checkbox was checked)
  const shouldCopyInitiatives = formData.get("copyInitiatives") === "true"
  const clonedInitiatives: Array<{ name: string; hypothesis: string }>  = []
  if (shouldCopyInitiatives) {
    for (let i = 0; i < 50; i++) {
      const name = (formData.get(`initiative_${i}_name`) as string)?.trim()
      const hypothesis = (formData.get(`initiative_${i}_hypothesis`) as string)?.trim()
      if (name && hypothesis) {
        clonedInitiatives.push({ name, hypothesis })
      } else {
        break
      }
    }
  }

  const commitment = await db.teamCommitment.create({
    data: {
      teamId,
      strategicIntent,
      primaryOutcomeStatement,
      primaryMetric,
      primaryBaseline,
      primaryTarget,
      primaryCurrent,
      cycleLabel,
      cycleStartDate: start,
      cycleEndDate: end,
      supportingSignals: {
        create: signals.map((s, i) => ({
          statement: s.statement,
          metric: s.metric,
          baseline: s.baseline,
          target: s.target,
          current: s.current,
          order: i,
        })),
      },
      initiatives: clonedInitiatives.length > 0 ? {
        create: clonedInitiatives.map((init) => ({
          name: init.name,
          hypothesis: init.hypothesis,
          status: "ACTIVE" as const,
        })),
      } : undefined,
    },
  })

  trackEvent({
    userId: session.user.id,
    event: "commitment_created",
    properties: { teamId, commitmentId: commitment.id, signalCount: signals.length },
  })

  redirect(`/team/${teamId}/commitment/${commitment.id}`)
}

export async function updatePrimaryCurrent(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const commitmentId = formData.get("commitmentId") as string
  const rawValue = (formData.get("currentValue") as string)?.trim() || null
  const current = parseRequiredFloat(rawValue)

  if (current === null) {
    return { error: "Current value is required and must be a number." }
  }

  await db.teamCommitment.update({
    where: { id: commitmentId },
    data: { primaryCurrent: current },
  })

  const commitment = await db.teamCommitment.findUnique({
    where: { id: commitmentId },
    select: { teamId: true },
  })
  if (commitment) {
    revalidatePath(`/team/${commitment.teamId}`)
  }
  return null
}

export async function updateSignalCurrent(
  signalId: string,
  value: number
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const signal = await db.supportingSignal.update({
    where: { id: signalId },
    data: { current: value },
    include: { commitment: { select: { teamId: true, id: true } } },
  })

  revalidatePath(`/team/${signal.commitment.teamId}`)
}

export async function completeCommitment(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const teamId = formData.get("teamId") as string
  const commitmentId = formData.get("commitmentId") as string
  const notes = (formData.get("completionNotes") as string)?.trim()

  if (!notes) return { error: "Completion notes are required." }
  if (notes.length < 20) {
    return { error: "Please provide more detailed learnings (at least 20 characters)." }
  }

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (!member) return { error: "You are not a member of this team." }

  const commitment = await db.teamCommitment.findUnique({
    where: { id: commitmentId },
  })
  if (!commitment || commitment.teamId !== teamId) {
    return { error: "Commitment not found." }
  }
  if (commitment.status !== "ACTIVE") {
    return { error: "Only active commitments can be completed." }
  }

  await db.teamCommitment.update({
    where: { id: commitmentId },
    data: {
      status: "COMPLETED",
      completionNotes: notes,
      completedAt: new Date(),
    },
  })

  trackEvent({
    userId: session.user.id,
    event: "commitment_completed",
    properties: { teamId, commitmentId },
  })

  revalidatePath(`/team/${teamId}`)
  redirect(`/team/${teamId}`)
}

export async function abandonCommitment(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const teamId = formData.get("teamId") as string
  const commitmentId = formData.get("commitmentId") as string
  const reason = (formData.get("abandonmentReason") as string)?.trim()

  if (!reason) return { error: "A reason for abandonment is required." }
  if (reason.length < 15) {
    return { error: "Please provide a more detailed reason (at least 15 characters)." }
  }

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (!member) return { error: "You are not a member of this team." }

  const commitment = await db.teamCommitment.findUnique({
    where: { id: commitmentId },
  })
  if (!commitment || commitment.teamId !== teamId) {
    return { error: "Commitment not found." }
  }
  if (commitment.status !== "ACTIVE") {
    return { error: "Only active commitments can be abandoned." }
  }

  await db.teamCommitment.update({
    where: { id: commitmentId },
    data: {
      status: "ABANDONED",
      abandonmentReason: reason,
      abandonedAt: new Date(),
    },
  })

  revalidatePath(`/team/${teamId}`)
  redirect(`/team/${teamId}`)
}

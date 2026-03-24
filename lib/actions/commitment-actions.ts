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
  return Number.isNaN(num) ? null : num
}

function parseRequiredFloat(value: string | null): number | null {
  if (!value) return null
  const num = parseFloat(value)
  return Number.isNaN(num) ? null : num
}

const MAX_OBJECTIVES = 8
const MAX_KEY_RESULTS_PER_OBJECTIVE = 8

interface ParsedObjective {
  title: string
  description: string | null
  keyResults: Array<{
    title: string
    metric: string
    baseline: number | null
    target: number
    current: number
  }>
}

function parseObjectivesFromForm(
  formData: FormData
): ParsedObjective[] | { error: string } {
  const objectives: ParsedObjective[] = []

  for (let oi = 0; oi < MAX_OBJECTIVES; oi++) {
    const title = (formData.get(`obj_${oi}_title`) as string)?.trim()
    if (!title) continue

    const description =
      (formData.get(`obj_${oi}_description`) as string)?.trim() || null

    const keyResults: ParsedObjective["keyResults"] = []
    for (let ki = 0; ki < MAX_KEY_RESULTS_PER_OBJECTIVE; ki++) {
      const metric = (formData.get(`obj_${oi}_kr_${ki}_metric`) as string)?.trim()
      if (!metric) continue

      const krTitle =
        (formData.get(`obj_${oi}_kr_${ki}_title`) as string)?.trim() || metric
      const target = parseRequiredFloat(
        (formData.get(`obj_${oi}_kr_${ki}_target`) as string)?.trim() || null
      )
      const current = parseRequiredFloat(
        (formData.get(`obj_${oi}_kr_${ki}_current`) as string)?.trim() || null
      )
      if (target === null) {
        return {
          error: `Objective “${title.slice(0, 40)}…”: key result ${ki + 1} needs a valid target number.`,
        }
      }
      if (current === null) {
        return {
          error: `Objective “${title.slice(0, 40)}…”: key result ${ki + 1} needs a valid current number.`,
        }
      }
      keyResults.push({
        title: krTitle,
        metric,
        baseline: parseOptionalFloat(
          (formData.get(`obj_${oi}_kr_${ki}_baseline`) as string)?.trim() || null
        ),
        target,
        current,
      })
    }

    objectives.push({ title, description, keyResults })
  }

  if (objectives.length === 0) {
    return { error: "Add at least one team objective with a title." }
  }

  for (const o of objectives) {
    if (o.keyResults.length === 0) {
      return {
        error: `Objective “${o.title.slice(0, 60)}” needs at least one key result with a metric.`,
      }
    }
  }

  return objectives
}

export async function createCommitment(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const teamId = formData.get("teamId") as string
  const title = (formData.get("title") as string)?.trim()
  const rawTeamObjective = (formData.get("teamObjective") as string)?.trim()
  const cycleLabel = (formData.get("cycleLabel") as string)?.trim() || null
  const cycleStartDate = formData.get("cycleStartDate") as string
  const cycleEndDate = formData.get("cycleEndDate") as string

  if (!title) return { error: "A short Team OKR title is required." }
  if (title.length > 120) return { error: "Title must be 120 characters or less." }
  if (!cycleStartDate || !cycleEndDate) return { error: "Cycle dates are required." }

  const start = new Date(cycleStartDate)
  const end = new Date(cycleEndDate)
  if (end <= start) return { error: "End date must be after start date." }

  const parsed = parseObjectivesFromForm(formData)
  if ("error" in parsed) {
    return { error: parsed.error }
  }
  const objectives = parsed
  const teamObjective = rawTeamObjective || objectives[0]?.title || ""

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (!member) return { error: "You are not a member of this team." }

  const activeCount = await db.teamOkr.count({
    where: { teamId, status: "ACTIVE" },
  })
  const isPrimary = activeCount === 0

  const shouldCopyInitiatives = formData.get("copyInitiatives") === "true"
  const clonedInitiatives: Array<{ name: string; hypothesis: string }> = []
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

  const commitment = await db.teamOkr.create({
    data: {
      teamId,
      title,
      teamObjective,
      cycleLabel,
      cycleStartDate: start,
      cycleEndDate: end,
      isPrimary,
      objectives: {
        create: objectives.map((o, oi) => ({
          title: o.title,
          description: o.description,
          sortOrder: oi,
          keyResults: {
            create: o.keyResults.map((kr, ki) => ({
              title: kr.title,
              metric: kr.metric,
              baseline: kr.baseline,
              target: kr.target,
              current: kr.current,
              sortOrder: ki,
            })),
          },
        })),
      },
      initiatives:
        clonedInitiatives.length > 0
          ? {
              create: clonedInitiatives.map((init) => ({
                name: init.name,
                hypothesis: init.hypothesis,
                status: "ACTIVE" as const,
              })),
            }
          : undefined,
    },
  })

  trackEvent({
    userId: session.user.id,
    event: "commitment_created",
    properties: {
      teamId,
      commitmentId: commitment.id,
      objectiveCount: objectives.length,
      keyResultCount: objectives.reduce((n, o) => n + o.keyResults.length, 0),
    },
  })

  redirect(`/team/${teamId}/commitment/${commitment.id}`)
}

export async function updateKeyResultCurrent(
  keyResultId: string,
  value: number
) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const kr = await db.keyResult.update({
    where: { id: keyResultId },
    data: { current: value },
    include: {
      objective: {
        include: { teamOkr: { select: { teamId: true, id: true } } },
      },
    },
  })

  revalidatePath(`/team/${kr.objective.teamOkr.teamId}`)
}

export async function createObjective(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const teamId = formData.get("teamId") as string
  const commitmentId = formData.get("commitmentId") as string
  const title = (formData.get("title") as string)?.trim()
  const description = (formData.get("description") as string)?.trim() || null

  if (!title) return { error: "Team objective title is required." }

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (!member) return { error: "You are not a member of this team." }

  const teamOkr = await db.teamOkr.findUnique({
    where: { id: commitmentId },
    select: { teamId: true, status: true },
  })
  if (!teamOkr || teamOkr.teamId !== teamId || teamOkr.status !== "ACTIVE") {
    return { error: "Team OKR not found or not active." }
  }

  const agg = await db.objective.aggregate({
    where: { teamOkrId: commitmentId },
    _max: { sortOrder: true },
  })
  const nextOrder = (agg._max.sortOrder ?? -1) + 1

  await db.objective.create({
    data: {
      teamOkrId: commitmentId,
      title,
      description,
      sortOrder: nextOrder,
    },
  })

  revalidatePath(`/team/${teamId}`)
  revalidatePath(`/team/${teamId}/commitment/${commitmentId}`)
  return null
}

export async function createKeyResult(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const teamId = formData.get("teamId") as string
  const commitmentId = formData.get("commitmentId") as string
  const objectiveId = formData.get("objectiveId") as string

  const titleRaw = (formData.get("title") as string)?.trim()
  const metric = (formData.get("metric") as string)?.trim()
  const baseline = parseOptionalFloat(
    (formData.get("baseline") as string)?.trim() || null
  )
  const target = parseRequiredFloat((formData.get("target") as string)?.trim() || null)
  const current = parseRequiredFloat((formData.get("current") as string)?.trim() || null)

  if (!metric) return { error: "Metric is required." }
  if (target === null) return { error: "Target must be a number." }
  if (current === null) return { error: "Current value must be a number." }

  const title = titleRaw || metric

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (!member) return { error: "You are not a member of this team." }

  const objective = await db.objective.findUnique({
    where: { id: objectiveId },
    include: { teamOkr: { select: { id: true, teamId: true, status: true } } },
  })
  if (
    !objective ||
    objective.teamOkrId !== commitmentId ||
    objective.teamOkr.teamId !== teamId ||
    objective.teamOkr.status !== "ACTIVE"
  ) {
    return { error: "Objective not found." }
  }

  const agg = await db.keyResult.aggregate({
    where: { objectiveId },
    _max: { sortOrder: true },
  })
  const nextOrder = (agg._max.sortOrder ?? -1) + 1

  await db.keyResult.create({
    data: {
      objectiveId,
      title,
      metric,
      baseline,
      target,
      current,
      sortOrder: nextOrder,
    },
  })

  revalidatePath(`/team/${teamId}`)
  revalidatePath(`/team/${teamId}/commitment/${commitmentId}`)
  return null
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

  const teamOkr = await db.teamOkr.findUnique({
    where: { id: commitmentId },
  })
  if (!teamOkr || teamOkr.teamId !== teamId) {
    return { error: "Team OKR not found." }
  }
  if (teamOkr.status !== "ACTIVE") {
    return { error: "Only active Team OKRs can be completed." }
  }

  await db.teamOkr.update({
    where: { id: commitmentId },
    data: {
      status: "COMPLETED",
      isPrimary: false,
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

  if (!reason) return { error: "A reason is required." }
  if (reason.length < 15) {
    return { error: "Please provide a more detailed reason (at least 15 characters)." }
  }

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (!member) return { error: "You are not a member of this team." }

  const teamOkr = await db.teamOkr.findUnique({
    where: { id: commitmentId },
  })
  if (!teamOkr || teamOkr.teamId !== teamId) {
    return { error: "Team OKR not found." }
  }
  if (teamOkr.status !== "ACTIVE") {
    return { error: "Only active Team OKRs can be ended." }
  }

  await db.teamOkr.update({
    where: { id: commitmentId },
    data: {
      status: "ABANDONED",
      isPrimary: false,
      abandonmentReason: reason,
      abandonedAt: new Date(),
    },
  })

  revalidatePath(`/team/${teamId}`)
  redirect(`/team/${teamId}`)
}

/** Exactly one ACTIVE Team OKR per team may be primary. */
export async function setPrimaryTeamOkr(teamId: string, teamOkrId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  })
  if (!member) return

  const okr = await db.teamOkr.findUnique({
    where: { id: teamOkrId },
    select: { teamId: true, status: true },
  })
  if (!okr || okr.teamId !== teamId || okr.status !== "ACTIVE") return

  await db.$transaction([
    db.teamOkr.updateMany({
      where: { teamId, status: "ACTIVE" },
      data: { isPrimary: false },
    }),
    db.teamOkr.update({
      where: { id: teamOkrId },
      data: { isPrimary: true },
    }),
  ])

  revalidatePath(`/team/${teamId}`)
  revalidatePath(`/team/${teamId}/commitment/${teamOkrId}`)
}

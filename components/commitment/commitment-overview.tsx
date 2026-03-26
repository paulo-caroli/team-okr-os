"use client"

import { useState, useCallback } from "react"
import type { CommitmentView } from "@/lib/domain/commitment"
import { flatKeyResults } from "@/lib/domain/commitment"
import type { InitiativeView } from "@/lib/domain/initiative"
import type { CheckInView } from "@/lib/domain/check-in"
import {
  updateTeamOkrTitle,
  updateTeamOkrContext,
  updateObjectiveFields,
  updateKeyResultDefinition,
  addKeyResultToObjective,
  deleteKeyResult,
} from "@/lib/actions/commitment-actions"
import { TeamOkrHeading } from "./team-okr-heading"
import { TeamOkrsSection, type EditableKR } from "./team-okrs-section"
import { InitiativeList } from "@/components/initiative/initiative-list"
import { CheckInTimeline } from "@/components/check-in/check-in-timeline"
import { CommitmentStatusBar } from "./commitment-status-bar"
import { CompletionNotice } from "./completion-notice"
import { AbandonmentNotice } from "./abandonment-notice"
import { Button } from "@/components/ui/button"
import { Dialog, DialogHeader } from "@/components/ui/dialog"

interface CommitmentOverviewProps {
  commitment: CommitmentView
  initiatives: InitiativeView[]
  checkIns: CheckInView[]
  teamId: string
}

export function CommitmentOverview({
  commitment,
  initiatives,
  checkIns,
  teamId,
}: CommitmentOverviewProps) {
  const readOnly = commitment.status !== "ACTIVE"
  const keyResults = flatKeyResults(commitment.objectives)

  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

  const objective = commitment.objectives[0] ?? null

  function buildEditableKRs(): EditableKR[] {
    if (!objective) return []
    return objective.keyResults.map((kr) => ({ ...kr }))
  }

  const [editableKRs, setEditableKRs] = useState<EditableKR[]>(buildEditableKRs)
  const [deletedKRIds, setDeletedKRIds] = useState<string[]>([])

  const hasCheckIns = commitment.checkInCount > 0

  function enterEditMode() {
    setEditableKRs(buildEditableKRs())
    setDeletedKRIds([])
    setEditMode(true)
  }

  const handleAddKR = useCallback(() => {
    setEditableKRs((prev) => [
      ...prev,
      {
        _tempId: `new_${Date.now()}`,
        id: "",
        title: "",
        metric: "",
        baseline: null,
        target: 0,
        current: 0,
        dueDate: null,
        sortOrder: prev.length,
      },
    ])
  }, [])

  const handleDeleteKR = useCallback((index: number) => {
    setEditableKRs((prev) => {
      const kr = prev[index]
      if (kr && kr.id && !kr._tempId) {
        setDeletedKRIds((ids) => [...ids, kr.id])
      }
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  async function persistChanges(formData: FormData) {
    setSaving(true)

    const title = (formData.get("title") as string)?.trim()
    const context = (formData.get("context") as string) ?? ""
    const objId = formData.get("objectiveId") as string
    const objTitle = (formData.get("objTitle") as string)?.trim()
    const objDesc = (formData.get("objDescription") as string) ?? ""

    const promises: Promise<void>[] = []

    if (title && title !== commitment.title) {
      promises.push(updateTeamOkrTitle(commitment.id, title))
    }
    if (context.trim() !== commitment.teamObjective.trim()) {
      promises.push(updateTeamOkrContext(commitment.id, context))
    }

    if (objId && objective) {
      const titleChanged = objTitle && objTitle !== objective.title
      const descChanged = (objDesc.trim() || null) !== (objective.description || null)
      if (titleChanged || descChanged) {
        promises.push(
          updateObjectiveFields(objId, {
            title: titleChanged ? objTitle : undefined,
            description: descChanged ? objDesc.trim() || null : undefined,
          }),
        )
      }
    }

    for (const deletedId of deletedKRIds) {
      promises.push(deleteKeyResult(deletedId))
    }

    const krCount = parseInt((formData.get("kr_count") as string) || "0", 10)

    for (let i = 0; i < krCount; i++) {
      const isNew = formData.get(`kr_${i}_new`) === "true"
      const krTitle = (formData.get(`kr_${i}_title`) as string)?.trim()
      const metric = (formData.get(`kr_${i}_metric`) as string)?.trim()
      const baselineRaw = (formData.get(`kr_${i}_baseline`) as string)?.trim()
      const targetRaw = (formData.get(`kr_${i}_target`) as string)?.trim()
      const dueDateRaw = (formData.get(`kr_${i}_dueDate`) as string)?.trim()

      const baseline = baselineRaw ? parseFloat(baselineRaw) : null
      const target = targetRaw ? parseFloat(targetRaw) : NaN
      const dueDate = dueDateRaw ? new Date(dueDateRaw) : null
      const validDueDate = dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null

      if (isNew) {
        if (!krTitle || !metric || Number.isNaN(target)) continue
        promises.push(
          addKeyResultToObjective(objId, {
            title: krTitle,
            metric,
            baseline,
            target,
            current: baseline ?? 0,
            dueDate: validDueDate,
          }),
        )
      } else {
        const krId = formData.get(`kr_${i}_id`) as string
        const originalKR = objective?.keyResults.find((kr) => kr.id === krId)
        if (!originalKR) continue

        const oldDueDate = originalKR.dueDate ? new Date(originalKR.dueDate).toISOString().slice(0, 10) : null
        const newDueDateStr = validDueDate ? validDueDate.toISOString().slice(0, 10) : null

        const titleChanged = krTitle && krTitle !== originalKR.title
        const metricChanged = metric && metric !== originalKR.metric
        const baselineChanged = baseline !== originalKR.baseline
        const targetChanged = !Number.isNaN(target) && target !== originalKR.target
        const dueDateChanged = newDueDateStr !== oldDueDate

        if (titleChanged || metricChanged || baselineChanged || targetChanged || dueDateChanged) {
          const data: { title?: string; metric?: string; baseline?: number | null; target?: number; dueDate?: Date | null } = {}
          if (titleChanged) data.title = krTitle
          if (metricChanged) data.metric = metric
          if (baselineChanged) data.baseline = baseline
          if (targetChanged) data.target = target
          if (dueDateChanged) data.dueDate = validDueDate
          promises.push(updateKeyResultDefinition(krId, data))
        }
      }
    }

    await Promise.all(promises)
    setSaving(false)
    setEditMode(false)
  }

  function handleSubmit(formData: FormData) {
    if (hasCheckIns) {
      setPendingFormData(formData)
      setConfirmOpen(true)
    } else {
      void persistChanges(formData)
    }
  }

  function handleConfirm() {
    setConfirmOpen(false)
    if (pendingFormData) {
      void persistChanges(pendingFormData)
      setPendingFormData(null)
    }
  }

  return (
    <div className="space-y-8">
      {editMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/50 dark:bg-amber-900/10">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Editing a Team OKR should be rare.
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Use check-ins to update progress.
          </p>
        </div>
      )}

      {editMode ? (
        <form action={handleSubmit}>
          <div className="space-y-8">
            <TeamOkrHeading commitment={commitment} editMode />
            <TeamOkrsSection
              commitment={commitment}
              editMode
              editableKRs={editableKRs}
              onAddKR={handleAddKR}
              onDeleteKR={handleDeleteKR}
            />
          </div>
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditMode(false)
                setEditableKRs(buildEditableKRs())
                setDeletedKRIds([])
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      ) : (
        <>
          <TeamOkrHeading commitment={commitment} />

          <CommitmentStatusBar
            commitment={commitment}
            teamId={teamId}
            onEdit={enterEditMode}
          />

          {commitment.status === "COMPLETED" && (
            <CompletionNotice
              notes={commitment.completionNotes}
              completedAt={commitment.completedAt}
            />
          )}

          {commitment.status === "ABANDONED" && (
            <AbandonmentNotice
              reason={commitment.abandonmentReason}
              abandonedAt={commitment.abandonedAt}
            />
          )}

          <TeamOkrsSection commitment={commitment} />

          <InitiativeList
            initiatives={initiatives}
            commitmentId={commitment.id}
            teamId={teamId}
            keyResults={keyResults}
            readOnly={readOnly}
            hasCheckIns={hasCheckIns}
          />

          <CheckInTimeline
            checkIns={checkIns}
            commitmentId={commitment.id}
            teamId={teamId}
            readOnly={readOnly}
          />
        </>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogHeader
          title="Save changes?"
          description="This Team OKR already has progress updates. Editing definitions may affect historical tracking."
        />
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setConfirmOpen(false)
              setPendingFormData(null)
            }}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            Save anyway
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

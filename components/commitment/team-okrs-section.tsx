"use client"

import { useState, useActionState } from "react"
import type { CommitmentView, KeyResult, ObjectiveView } from "@/lib/domain/commitment"
import {
  objectiveProgressPercent,
  keyResultProgressPercent,
} from "@/lib/domain/commitment"
import { updateKeyResultCurrent, createKeyResult } from "@/lib/actions/commitment-actions"
import { SectionHeader } from "@/components/ui/section-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TeamOkrsSectionProps {
  commitment: CommitmentView
  teamId: string
}

function KeyResultRow({
  kr,
  readOnly,
}: {
  kr: KeyResult
  readOnly: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave(formData: FormData) {
    setSaving(true)
    const rawValue = (formData.get("currentValue") as string)?.trim()
    const value = rawValue ? parseFloat(rawValue) : NaN
    if (Number.isNaN(value)) {
      setSaving(false)
      return
    }
    await updateKeyResultCurrent(kr.id, value)
    setEditing(false)
    setSaving(false)
  }

  const krPct = Math.round(keyResultProgressPercent(kr))

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/30">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{kr.title}</p>
          <div className="mt-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Metric
            </span>
            <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{kr.metric}</p>
          </div>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            {kr.baseline !== null && <span>Baseline: {kr.baseline}</span>}
            <span>Target: {kr.target}</span>
            <span className="font-medium text-zinc-600 dark:text-zinc-300">Progress: {krPct}%</span>
          </div>
        </div>
        <div className="text-right">
          {readOnly ? (
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{kr.current}</span>
          ) : editing ? (
            <form action={handleSave} className="flex items-center gap-2">
              <Input
                name="currentValue"
                type="number"
                step="any"
                defaultValue={String(kr.current)}
                placeholder="Value"
                className="h-7 w-24 text-xs"
                required
                autoFocus
              />
              <Button size="sm" type="submit" loading={saving}>
                Save
              </Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <span
              className="cursor-pointer text-sm font-medium text-zinc-700 underline decoration-dashed underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              onClick={() => setEditing(true)}
            >
              {kr.current}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function AddKeyResultForm({
  objectiveId,
  commitmentId,
  teamId,
}: {
  objectiveId: string
  commitmentId: string
  teamId: string
}) {
  const [state, formAction, isPending] = useActionState(createKeyResult, null)
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        + Add Key Result
      </Button>
    )
  }

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-lg border border-dashed border-zinc-200 p-4 dark:border-zinc-700">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="commitmentId" value={commitmentId} />
      <input type="hidden" name="objectiveId" value={objectiveId} />
      {state?.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <Input name="title" label="Title" placeholder="Short name for this result" />
      <Input name="metric" label="Metric" placeholder="What you measure" required />
      <div className="grid grid-cols-3 gap-3">
        <Input name="baseline" type="number" step="any" label="Baseline (optional)" />
        <Input name="target" type="number" step="any" label="Target" required />
        <Input name="current" type="number" step="any" label="Current" required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={isPending}>
          Save key result
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function ObjectiveCard({
  objective,
  commitmentId,
  teamId,
  readOnly,
}: {
  objective: ObjectiveView
  commitmentId: string
  teamId: string
  readOnly: boolean
}) {
  const pct = Math.round(objectiveProgressPercent(objective))

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Team Objective
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {objective.title}
          </h3>
          {objective.description && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{objective.description}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">Objective progress</span>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{pct}%</p>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all dark:bg-emerald-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Key Results
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Measurable outcomes that show real progress toward the objective.
        </p>

        {objective.keyResults.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No key results yet. Add 2–4 key results to measure progress.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {objective.keyResults.map((kr) => (
              <KeyResultRow key={kr.id} kr={kr} readOnly={readOnly} />
            ))}
          </div>
        )}

        {!readOnly && (
          <div className="mt-4">
            <AddKeyResultForm
              objectiveId={objective.id}
              commitmentId={commitmentId}
              teamId={teamId}
            />
          </div>
        )}
      </div>
    </Card>
  )
}

export function TeamOkrsSection({ commitment, teamId }: TeamOkrsSectionProps) {
  const readOnly = commitment.status !== "ACTIVE"

  return (
    <div>
      <SectionHeader
        title="Objective"
        description="The objective and measurable key results for this Team OKR."
        className="mb-4"
      />

      {commitment.objectives.length > 0 ? (
        <ObjectiveCard
          objective={commitment.objectives[0]}
          commitmentId={commitment.id}
          teamId={teamId}
          readOnly={readOnly}
        />
      ) : (
        <Card className="p-5">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No objective defined yet.
          </p>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState, useActionState } from "react"
import type { CommitmentView, KeyResult, ObjectiveView } from "@/lib/domain/commitment"
import {
  aggregateKeyResultProgress,
  keyResultProgressPercent,
} from "@/lib/domain/commitment"
import { createKeyResult } from "@/lib/actions/commitment-actions"
import { formatDate } from "@/lib/utils"
import { SectionHeader } from "@/components/ui/section-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface TeamOkrsSectionProps {
  commitment: CommitmentView
  teamId: string
  editMode?: boolean
}

function dueDateStyle(date: Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return "text-red-500 dark:text-red-400"
  if (diffDays <= 7) return "text-amber-600 dark:text-amber-400"
  return "text-zinc-400 dark:text-zinc-500"
}

function dueDateLabel(date: Date): string {
  const now = new Date()
  const d = new Date(date)
  if (d.getTime() < now.getTime()) return `Overdue · ${formatDate(d)}`
  return `Due: ${formatDate(d)}`
}

function KeyResultRow({
  kr,
  editMode,
  krIndex,
  cycleEndDate,
}: {
  kr: KeyResult
  editMode?: boolean
  krIndex: number
  cycleEndDate: Date
}) {
  const krPct = Math.round(keyResultProgressPercent(kr))
  const dueDate = kr.dueDate ?? cycleEndDate

  if (editMode) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <input type="hidden" name={`kr_${krIndex}_id`} value={kr.id} />
        <Input
          name={`kr_${krIndex}_title`}
          label="Key Result"
          defaultValue={kr.title}
          required
        />
        <div className="mt-3">
          <Input
            name={`kr_${krIndex}_metric`}
            label="Metric"
            defaultValue={kr.metric}
            required
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Input
            name={`kr_${krIndex}_baseline`}
            type="number"
            step="any"
            label="Baseline (optional)"
            defaultValue={kr.baseline !== null ? String(kr.baseline) : ""}
          />
          <Input
            name={`kr_${krIndex}_target`}
            type="number"
            step="any"
            label="Target"
            defaultValue={String(kr.target)}
            required
          />
          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Current
            </span>
            <div className="flex h-10 items-center rounded-lg border border-zinc-100 bg-zinc-50 px-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              {kr.current}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Updated via check-ins</p>
          </div>
        </div>
        <div className="mt-3">
          <Input
            name={`kr_${krIndex}_dueDate`}
            type="date"
            label="Due date (optional)"
            defaultValue={kr.dueDate ? new Date(kr.dueDate).toISOString().slice(0, 10) : ""}
            hint="Defaults to the Team OKR cycle end date"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/30">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{kr.title}</p>
            <span className={`text-[11px] ${dueDateStyle(dueDate)}`}>
              {dueDateLabel(dueDate)}
            </span>
          </div>
          <div className="mt-1">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Metric
            </span>
            <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{kr.metric}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            {kr.baseline !== null && <span>Baseline: {kr.baseline}</span>}
            <span>Target: {kr.target}</span>
            <span className="font-medium text-zinc-600 dark:text-zinc-300">Progress: {krPct}%</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{kr.current}</span>
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
  editMode,
  cycleEndDate,
}: {
  objective: ObjectiveView
  commitmentId: string
  teamId: string
  readOnly: boolean
  editMode?: boolean
  cycleEndDate: Date
}) {
  const pct = Math.round(aggregateKeyResultProgress(objective))

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Team Objective
          </p>

          {editMode ? (
            <div className="mt-2 space-y-3">
              <input type="hidden" name="objectiveId" value={objective.id} />
              <Input
                name="objTitle"
                label="Objective"
                defaultValue={objective.title}
                required
              />
              <Textarea
                name="objDescription"
                label="Strategic Context (optional)"
                defaultValue={objective.description ?? ""}
                rows={2}
                placeholder="Why this matters and how it connects to the bigger picture"
              />
            </div>
          ) : (
            <>
              <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {objective.title}
              </h3>
              {objective.description && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {objective.description}
                </p>
              )}
            </>
          )}
        </div>
        {!editMode && (
          <div className="shrink-0 text-right">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Progress</span>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{pct}%</p>
          </div>
        )}
      </div>

      {!editMode && (
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all dark:bg-emerald-500"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
      )}

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
            {objective.keyResults.map((kr, i) => (
              <KeyResultRow
                key={kr.id}
                kr={kr}
                editMode={editMode}
                krIndex={i}
                cycleEndDate={cycleEndDate}
              />
            ))}
          </div>
        )}

        {!readOnly && !editMode && (
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

export function TeamOkrsSection({ commitment, teamId, editMode }: TeamOkrsSectionProps) {
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
          editMode={editMode}
          cycleEndDate={commitment.cycle.endDate}
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

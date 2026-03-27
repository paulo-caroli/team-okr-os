"use client"

import { useState } from "react"
import type { CommitmentView, KeyResult, ObjectiveView } from "@/lib/domain/commitment"
import type { InitiativeView } from "@/lib/domain/initiative"
import {
  aggregateKeyResultProgress,
  keyResultProgressPercent,
  sortKeyResultsByDate,
} from "@/lib/domain/commitment"
import { formatDateShort } from "@/lib/utils"
import { SectionHeader } from "@/components/ui/section-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export interface EditableKR {
  _tempId?: string
  id: string
  title: string
  metric: string
  baseline: number | null
  target: number
  current: number
  dueDate: Date | null
  sortOrder: number
}

interface TeamOkrsSectionProps {
  commitment: CommitmentView
  editMode?: boolean
  editableKRs?: EditableKR[]
  onAddKR?: () => void
  onDeleteKR?: (index: number) => void
  initiatives?: InitiativeView[]
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

function targetDateLabel(date: Date, isFallback: boolean, cycleEndDate?: Date): string {
  const now = new Date()
  const d = new Date(date)
  if (d.getTime() < now.getTime()) return `Overdue \u00b7 ${formatDateShort(d)}`
  if (isFallback) return `Target date: End of cycle (${formatDateShort(d)})`
  if (cycleEndDate) {
    const end = new Date(cycleEndDate)
    const diffMs = end.getTime() - d.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays > 0) {
      return `Target date: ${formatDateShort(d)} (${diffDays} day${diffDays === 1 ? "" : "s"} before cycle end)`
    }
  }
  return `Target date: ${formatDateShort(d)}`
}

function KeyResultEditRow({
  kr,
  krIndex,
  onDelete,
  isNew,
}: {
  kr: EditableKR
  krIndex: number
  onDelete?: () => void
  isNew: boolean
}) {
  const [liveBaseline, setLiveBaseline] = useState(
    kr.baseline !== null ? String(kr.baseline) : ""
  )

  const currentDisplay = isNew
    ? (liveBaseline ? parseFloat(liveBaseline) || 0 : 0)
    : kr.current

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      {!isNew && <input type="hidden" name={`kr_${krIndex}_id`} value={kr.id} />}
      {isNew && <input type="hidden" name={`kr_${krIndex}_new`} value="true" />}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Input
            name={`kr_${krIndex}_title`}
            label="Key Result"
            defaultValue={kr.title}
            required
          />
        </div>
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="mt-6 shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove
          </Button>
        )}
      </div>
      <div className="mt-3">
        <Input
          name={`kr_${krIndex}_metric`}
          label="Metric"
          defaultValue={kr.metric}
          required
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {isNew ? (
          <Input
            name={`kr_${krIndex}_baseline`}
            type="number"
            step="any"
            label="Baseline (optional)"
            value={liveBaseline}
            onChange={(e) => setLiveBaseline(e.target.value)}
          />
        ) : (
          <Input
            name={`kr_${krIndex}_baseline`}
            type="number"
            step="any"
            label="Baseline (optional)"
            defaultValue={kr.baseline !== null ? String(kr.baseline) : ""}
          />
        )}
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
            {currentDisplay}
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Updated via check-ins</p>
        </div>
      </div>
      <div className="mt-3">
        <Input
          name={`kr_${krIndex}_dueDate`}
          type="date"
          label="Target date (optional)"
          defaultValue={kr.dueDate ? new Date(kr.dueDate).toISOString().slice(0, 10) : ""}
          hint="Defaults to the end of cycle"
        />
      </div>
    </div>
  )
}

function KeyResultReadRow({
  kr,
  cycleEndDate,
  initiatives,
}: {
  kr: KeyResult
  cycleEndDate: Date
  initiatives?: InitiativeView[]
}) {
  const krPct = Math.round(keyResultProgressPercent(kr))
  const hasCustomDate = !!kr.dueDate
  const effectiveDate = kr.dueDate ?? cycleEndDate

  const relatedInitiatives = initiatives?.filter(
    (init) =>
      init.status !== "CONCLUDED" &&
      init.expectedImpact?.keyResultIds.includes(kr.id)
  ) ?? []

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/30">
      <div className="flex items-baseline gap-2">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{kr.title}</p>
      </div>
      <p className={`mt-0.5 text-[11px] ${dueDateStyle(effectiveDate)}`}>
        {targetDateLabel(effectiveDate, !hasCustomDate, hasCustomDate ? cycleEndDate : undefined)}
      </p>
      <div className="mt-1">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Metric
        </span>
        <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{kr.metric}</p>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        {kr.baseline !== null && <span>Baseline: {kr.baseline}</span>}
        <span>Current: <span className="font-medium text-zinc-700 dark:text-zinc-200">{kr.current}</span></span>
        <span>Target: {kr.target}</span>
        <span className="font-medium text-zinc-600 dark:text-zinc-300">Progress: {krPct}%</span>
      </div>

      {relatedInitiatives.length > 0 && (
        <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Initiatives
          </p>
          <ul className="mt-1.5 space-y-1">
            {relatedInitiatives.map((init) => {
              const initDueDate = null as Date | null
              const exceedsKrDate = false
              return (
                <li key={init.id} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="mt-0.5 text-zinc-300 dark:text-zinc-600">&bull;</span>
                  <div className="min-w-0 flex-1">
                    <span>{init.name}</span>
                    {initDueDate && (
                      <span className="ml-2 text-zinc-400 dark:text-zinc-500">
                        Due: {formatDateShort(initDueDate)}
                      </span>
                    )}
                    {exceedsKrDate && (
                      <span className="ml-2 text-amber-500 dark:text-amber-400">
                        \u26a0 Initiative due date exceeds KR target date
                      </span>
                    )}
                  </div>
                  <span className={`shrink-0 text-[10px] ${
                    init.status === "IN_PROGRESS"
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}>
                    {init.status === "IN_PROGRESS" ? "In progress" : "Not started"}
                  </span>
                </li>
              )
            })}
          </ul>
          {relatedInitiatives.length >= 5 && (
            <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              Limit: 5 to keep focus
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ObjectiveCard({
  objective,
  editMode,
  cycleEndDate,
  editableKRs,
  onAddKR,
  onDeleteKR,
  initiatives,
}: {
  objective: ObjectiveView
  editMode?: boolean
  cycleEndDate: Date
  editableKRs?: EditableKR[]
  onAddKR?: () => void
  onDeleteKR?: (index: number) => void
  initiatives?: InitiativeView[]
}) {
  const pct = Math.round(aggregateKeyResultProgress(objective))

  const krsToRender = editMode
    ? editableKRs ?? []
    : sortKeyResultsByDate(objective.keyResults, cycleEndDate)

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

        <input type="hidden" name="kr_count" value={krsToRender.length} />

        {krsToRender.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No key results yet. Add 2–4 key results to measure progress.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {editMode
              ? (krsToRender as EditableKR[]).map((kr, i) => (
                  <KeyResultEditRow
                    key={kr._tempId ?? kr.id}
                    kr={kr}
                    krIndex={i}
                    isNew={!!kr._tempId}
                    onDelete={onDeleteKR ? () => onDeleteKR(i) : undefined}
                  />
                ))
              : (krsToRender as KeyResult[]).map((kr) => (
                  <KeyResultReadRow
                    key={kr.id}
                    kr={kr}
                    cycleEndDate={cycleEndDate}
                    initiatives={initiatives}
                  />
                ))}
          </div>
        )}

        {editMode && onAddKR && (
          <div className="mt-4">
            <Button type="button" variant="ghost" size="sm" onClick={onAddKR}>
              + Add Key Result
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export function TeamOkrsSection({
  commitment,
  editMode,
  editableKRs,
  onAddKR,
  onDeleteKR,
  initiatives,
}: TeamOkrsSectionProps) {
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
          editMode={editMode}
          cycleEndDate={commitment.cycle.endDate}
          editableKRs={editableKRs}
          onAddKR={onAddKR}
          onDeleteKR={onDeleteKR}
          initiatives={initiatives}
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

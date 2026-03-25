"use client"

import { useState } from "react"
import type { InitiativeView } from "@/lib/domain/initiative"
import type { KeyResult } from "@/lib/domain/commitment"
import { deleteInitiative } from "@/lib/actions/initiative-actions"
import { InitiativeForm } from "./initiative-form"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

const COLLAPSE_THRESHOLD = 280

function ExpandableText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > COLLAPSE_THRESHOLD

  const displayed = isLong && !expanded
    ? text.slice(0, COLLAPSE_THRESHOLD).trimEnd() + "…"
    : text

  return (
    <div className={className}>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {displayed}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

function wasEdited(initiative: InitiativeView): boolean {
  const created = new Date(initiative.createdAt).getTime()
  const updated = new Date(initiative.updatedAt).getTime()
  return updated - created > 5000
}

interface InitiativeCardProps {
  initiative: InitiativeView
  commitmentId: string
  teamId: string
  keyResults: KeyResult[]
  readOnly?: boolean
  hasCheckIns?: boolean
}

export function InitiativeCard({
  initiative,
  commitmentId,
  teamId,
  keyResults,
  readOnly = false,
  hasCheckIns = false,
}: InitiativeCardProps) {
  const [editing, setEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const krLabelMap = new Map(keyResults.map((kr) => [kr.id, kr.title || kr.metric]))
  const edited = wasEdited(initiative)
  const showWarning = hasCheckIns || initiative.status === "CONCLUDED"
  const isInProgress = initiative.status === "IN_PROGRESS"
  const isConcluded = initiative.status === "CONCLUDED"

  async function handleDelete() {
    setDeleting(true)
    await deleteInitiative(initiative.id, teamId)
    setDeleting(false)
  }

  if (editing) {
    return (
      <Card className="py-4">
        <div className="min-w-0 space-y-4">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Edit Initiative
          </p>
          {showWarning && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-900/10">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This initiative has already been used in check-ins. Editing it may affect historical context.
              </p>
            </div>
          )}
          <InitiativeForm
            commitmentId={commitmentId}
            teamId={teamId}
            keyResults={keyResults}
            initiative={initiative}
            onSuccess={() => setEditing(false)}
            onCancel={() => setEditing(false)}
            variant="plain"
          />
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {initiative.name}
            </h4>
            <Badge
              variant={
                isConcluded ? "completed" : isInProgress ? "in_progress" : "default"
              }
            >
              {isConcluded
                ? "Concluded"
                : isInProgress
                  ? "In progress"
                  : "Not started"}
            </Badge>
            {edited && (
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Updated {formatDate(initiative.updatedAt)}
              </span>
            )}
          </div>

          <ExpandableText text={initiative.hypothesis} className="mt-2" />

          {initiative.expectedImpact && initiative.expectedImpact.keyResultIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {initiative.expectedImpact.keyResultIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  → {krLabelMap.get(id) || "Key result"}
                </span>
              ))}
            </div>
          )}

          {initiative.status === "CONCLUDED" && initiative.conclusionReason && (
            <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                Concluded
                {initiative.conclusionImpact && (
                  <span className="ml-1 font-normal">
                    — Impact: {initiative.conclusionImpact}
                  </span>
                )}
              </p>
              <ExpandableText text={initiative.conclusionReason} className="mt-1.5" />
            </div>
          )}

          {!readOnly && (
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-zinc-400 underline hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-400 underline hover:text-red-600 dark:text-red-500 dark:hover:text-red-400"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Delete this initiative?
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                loading={deleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

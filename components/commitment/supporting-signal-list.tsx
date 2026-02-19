"use client"

import type { SupportingSignal } from "@/lib/domain/commitment"
import { updateSignalCurrent } from "@/lib/actions/commitment-actions"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SupportingSignalListProps {
  signals: SupportingSignal[]
}

export function SupportingSignalList({ signals }: SupportingSignalListProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Progress Indicators
      </p>
      <div className="mt-3 space-y-3">
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  )
}

function SignalCard({ signal }: { signal: SupportingSignal }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave(formData: FormData) {
    setSaving(true)
    const rawValue = (formData.get("currentValue") as string)?.trim()
    const value = rawValue ? parseFloat(rawValue) : NaN
    if (isNaN(value)) {
      setSaving(false)
      return
    }
    await updateSignalCurrent(signal.id, value)
    setEditing(false)
    setSaving(false)
  }

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {signal.statement && (
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {signal.statement}
            </p>
          )}
          <div className={signal.statement ? "mt-1" : ""}>
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Metric
            </span>
            <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
              {signal.metric}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            {signal.baseline !== null && <span>Baseline: {signal.baseline}</span>}
            <span>Target: {signal.target}</span>
          </div>
        </div>
        <div className="text-right">
          {editing ? (
            <form action={handleSave} className="flex items-center gap-2">
              <Input
                name="currentValue"
                type="number"
                step="any"
                defaultValue={String(signal.current)}
                placeholder="Value"
                className="h-7 w-24 text-xs"
                required
                autoFocus
              />
              <Button size="sm" type="submit" loading={saving}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <span
              className="cursor-pointer text-sm font-medium text-zinc-700 underline decoration-dashed underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              onClick={() => setEditing(true)}
            >
              {signal.current}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

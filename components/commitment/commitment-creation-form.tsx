"use client"

import { useActionState, useState, useMemo } from "react"
import { createCommitment } from "@/lib/actions/commitment-actions"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SectionHeader } from "@/components/ui/section-header"
import type { CommitmentPrefill } from "@/app/(app)/team/[teamId]/commitment/new/page"

const TITLE_PLACEHOLDER = "Activation Boost"

const MAX_OBJECTIVES = 8
const MAX_KR = 8

const ACTIVITY_PREFIXES = ["implement", "build", "create", "launch", "deliver"]

function KrHintFeedback({
  metric,
  target,
  baseline,
  deadline,
}: {
  metric: string
  target: string
  baseline: string
  deadline: string
}) {
  const trimmed = metric.trim()
  if (!trimmed) return null

  const lower = trimmed.toLowerCase()
  if (ACTIVITY_PREFIXES.some((p) => lower.startsWith(p))) {
    return (
      <div className="mt-1.5 text-xs text-red-600 dark:text-red-400">
        <p>This looks like an activity. Try describing the result instead.</p>
        <p className="mt-0.5 text-zinc-400 dark:text-zinc-500">
          Example: Increase adoption of this feature to 30%
        </p>
      </div>
    )
  }

  if (!target.trim()) {
    return (
      <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
        Add a target to make this KR measurable
      </p>
    )
  }

  if (!baseline.trim()) {
    return (
      <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
        Add a baseline to track progress over time
      </p>
    )
  }

  if (deadline.trim()) {
    return (
      <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        This KR is measurable and time-bound
      </p>
    )
  }

  return (
    <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
      This KR is measurable and well defined
    </p>
  )
}

interface CommitmentCreationFormProps {
  teamId: string
  prefill?: CommitmentPrefill | null
}

function buildInitialKrCounts(prefill: CommitmentPrefill | null | undefined): Record<number, number> {
  if (!prefill?.objectives.length) {
    return { 0: 2 }
  }
  const m: Record<number, number> = {}
  prefill.objectives.forEach((o, i) => {
    m[i] = Math.max(o.keyResults.length, 2)
  })
  return m
}

export function CommitmentCreationForm({ teamId, prefill }: CommitmentCreationFormProps) {
  const [state, formAction, isPending] = useActionState(createCommitment, null)

  const initialObjectiveCount = prefill?.objectives.length ?? 1
  const [objectiveCount, setObjectiveCount] = useState(initialObjectiveCount)
  const [krCounts, setKrCounts] = useState<Record<number, number>>(() =>
    buildInitialKrCounts(prefill)
  )

  const [krCurrents, setKrCurrents] = useState<Record<string, string>>(() => {
    if (!prefill) return {}
    const init: Record<string, string> = {}
    prefill.objectives.forEach((o, oi) => {
      o.keyResults.forEach((kr, ki) => {
        init[`${oi}_${ki}`] = String(kr.current)
      })
    })
    return init
  })
  const [krTouched, setKrTouched] = useState<Record<string, boolean>>(() => {
    if (!prefill) return {}
    const init: Record<string, boolean> = {}
    prefill.objectives.forEach((o, oi) => {
      o.keyResults.forEach((_, ki) => {
        init[`${oi}_${ki}`] = true
      })
    })
    return init
  })

  const [krMetrics, setKrMetrics] = useState<Record<string, string>>(() => {
    if (!prefill) return {}
    const init: Record<string, string> = {}
    prefill.objectives.forEach((o, oi) => {
      o.keyResults.forEach((kr, ki) => {
        init[`${oi}_${ki}`] = kr.metric
      })
    })
    return init
  })
  const [krTargets, setKrTargets] = useState<Record<string, string>>(() => {
    if (!prefill) return {}
    const init: Record<string, string> = {}
    prefill.objectives.forEach((o, oi) => {
      o.keyResults.forEach((kr, ki) => {
        init[`${oi}_${ki}`] = String(kr.target)
      })
    })
    return init
  })
  const [krBaselines, setKrBaselines] = useState<Record<string, string>>(() => {
    if (!prefill) return {}
    const init: Record<string, string> = {}
    prefill.objectives.forEach((o, oi) => {
      o.keyResults.forEach((kr, ki) => {
        if (kr.baseline != null) init[`${oi}_${ki}`] = String(kr.baseline)
      })
    })
    return init
  })
  const [krDeadlines, setKrDeadlines] = useState<Record<string, string>>({})

  const [copyInitiatives, setCopyInitiatives] = useState(false)

  const defaultKrForSlot = useMemo(() => {
    return (oi: number, ki: number) => {
      const kr = prefill?.objectives[oi]?.keyResults[ki]
      return kr ?? null
    }
  }, [prefill])

  function handleKrBaselineBlur(oi: number, ki: number, e: React.FocusEvent<HTMLInputElement>) {
    const baseline = e.target.value.trim()
    const key = `${oi}_${ki}`
    if (baseline && !krTouched[key] && !krCurrents[key]) {
      setKrCurrents((prev) => ({ ...prev, [key]: baseline }))
    }
  }

  return (
    <form action={formAction} className="space-y-10">
      <input type="hidden" name="teamId" value={teamId} />

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      {prefill && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-800/50 dark:bg-blue-900/10">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            You are creating a new Team OKR based on a previous one.
          </p>
          <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
            Objectives and key results are pre-filled from the last cycle — adjust as needed.
          </p>
        </div>
      )}

      <div>
        <SectionHeader
          title="Team OKR"
          description="Define the objective and measurable key results for this cycle."
          className="mb-4"
        />

        <Card className="mb-8">
          <Input
            name="title"
            label="Title"
            placeholder={TITLE_PLACEHOLDER}
            hint='A short name for this Team OKR — e.g. "Reduce Churn" or "Improve Onboarding".'
            required
            maxLength={120}
            defaultValue={prefill?.title}
          />
        </Card>
        <div className="space-y-8">
          {Array.from({ length: objectiveCount }).map((_, oi) => {
            const prefillObj = prefill?.objectives[oi]
            const krSlotCount = krCounts[oi] ?? 2
            return (
              <Card key={oi} className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    Objective {oi + 1}
                  </span>
                  {objectiveCount > 1 && oi === objectiveCount - 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setObjectiveCount((c) => {
                          const last = c - 1
                          setKrCounts((prev) => {
                            const next = { ...prev }
                            delete next[last]
                            return next
                          })
                          return Math.max(1, c - 1)
                        })
                      }}
                    >
                      Remove this objective
                    </Button>
                  )}
                </div>

                <Textarea
                  name={`obj_${oi}_title`}
                  label="Objective"
                  placeholder="A clear, specific outcome this Team OKR is driving this cycle."
                  required
                  rows={2}
                  defaultValue={prefillObj?.title}
                />
                <Textarea
                  name={`obj_${oi}_description`}
                  label="Details (optional)"
                  rows={2}
                  placeholder="Optional context for this objective..."
                  defaultValue={prefillObj?.description ?? undefined}
                />

                <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Key Results</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        Measurable outcomes that show real progress toward the objective.
                      </p>
                    </div>
                    {krSlotCount < MAX_KR && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setKrCounts((prev) => ({
                            ...prev,
                            [oi]: (prev[oi] ?? 2) + 1,
                          }))
                        }
                      >
                        + Add Key Result
                      </Button>
                    )}
                  </div>

                  {krSlotCount === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No key results yet. Add 2–4 key results to measure progress.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {Array.from({ length: krSlotCount }).map((__, ki) => {
                        const slotKr = defaultKrForSlot(oi, ki)
                        const ck = `${oi}_${ki}`
                        return (
                          <div
                            key={ki}
                            className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/20"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs text-zinc-400">Key result {ki + 1}</span>
                              {krSlotCount > 1 && ki === krSlotCount - 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setKrCounts((prev) => ({
                                      ...prev,
                                      [oi]: Math.max(1, (prev[oi] ?? 2) - 1),
                                    }))
                                  }
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <Input
                              name={`obj_${oi}_kr_${ki}_title`}
                              label="Key Result"
                              placeholder="e.g. Increase activation rate from 20% to 40%"
                              defaultValue={slotKr?.title}
                            />
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                              Describe the measurable outcome. The fields below help track it.
                            </p>

                            <div className="mt-3 space-y-3 rounded-lg border border-zinc-100 bg-zinc-50/30 p-3 dark:border-zinc-800 dark:bg-zinc-800/10">
                              <Input
                                name={`obj_${oi}_kr_${ki}_metric`}
                                label="Metric"
                                placeholder="e.g. Number of users activated"
                                required
                                defaultValue={slotKr?.metric}
                                onChange={(e) =>
                                  setKrMetrics((p) => ({ ...p, [ck]: e.target.value }))
                                }
                              />
                              <KrHintFeedback
                                metric={krMetrics[ck] ?? slotKr?.metric ?? ""}
                                target={krTargets[ck] ?? (slotKr?.target != null ? String(slotKr.target) : "")}
                                baseline={krBaselines[ck] ?? (slotKr?.baseline != null ? String(slotKr.baseline) : "")}
                                deadline={krDeadlines[ck] ?? ""}
                              />
                              <div className="grid grid-cols-3 gap-3">
                                <Input
                                  name={`obj_${oi}_kr_${ki}_baseline`}
                                  type="number"
                                  step="any"
                                  label="Baseline (optional)"
                                  onBlur={(e) => handleKrBaselineBlur(oi, ki, e)}
                                  onChange={(e) =>
                                    setKrBaselines((p) => ({ ...p, [ck]: e.target.value }))
                                  }
                                  defaultValue={
                                    slotKr?.baseline != null ? String(slotKr.baseline) : undefined
                                  }
                                />
                                <Input
                                  name={`obj_${oi}_kr_${ki}_target`}
                                  type="number"
                                  step="any"
                                  label="Target"
                                  required
                                  defaultValue={slotKr?.target != null ? String(slotKr.target) : undefined}
                                  onChange={(e) =>
                                    setKrTargets((p) => ({ ...p, [ck]: e.target.value }))
                                  }
                                />
                                <Input
                                  name={`obj_${oi}_kr_${ki}_current`}
                                  type="number"
                                  step="any"
                                  label="Current"
                                  required
                                  value={krCurrents[ck] ?? ""}
                                  onChange={(e) => {
                                    setKrCurrents((p) => ({ ...p, [ck]: e.target.value }))
                                    setKrTouched((p) => ({ ...p, [ck]: true }))
                                  }}
                                />
                              </div>
                              <Input
                                name={`obj_${oi}_kr_${ki}_deadline`}
                                type="date"
                                label="Deadline (optional)"
                                hint="Defaults to the Team OKR cycle end date"
                                onChange={(e) =>
                                  setKrDeadlines((p) => ({ ...p, [ck]: e.target.value }))
                                }
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <div>
        <SectionHeader
          title="Cycle"
          description="The time boundary for this Team OKR"
          className="mb-4"
        />
        <Card>
          <Input
            name="cycleLabel"
            label="Cycle label (optional)"
            placeholder="e.g., Q1 2026, Sprint 4, 6-Week Cycle"
          />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input name="cycleStartDate" type="date" label="Start date" required />
            <Input name="cycleEndDate" type="date" label="End date" required />
          </div>
        </Card>
      </div>

      {prefill && prefill.initiatives.length > 0 && (
        <div>
          <SectionHeader
            title="Previous Initiatives"
            description={`${prefill.initiatives.length} initiative${prefill.initiatives.length > 1 ? "s" : ""} from the previous Team OKR`}
            className="mb-4"
          />
          <Card className="space-y-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="copyInitiatives"
                value="true"
                checked={copyInitiatives}
                onChange={(e) => setCopyInitiatives(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Copy previous initiatives into this new Team OKR
                </span>
                <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-500">
                  Initiative names and hypotheses will be copied. Status will be reset to Active.
                </span>
              </div>
            </label>

            {copyInitiatives && (
              <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                {prefill.initiatives.map((init, i) => (
                  <div key={i} className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{init.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{init.hypothesis}</p>
                    <input type="hidden" name={`initiative_${i}_name`} value={init.name} />
                    <input type="hidden" name={`initiative_${i}_hypothesis`} value={init.hypothesis} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" loading={isPending}>
            Create Team OKR
          </Button>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This creates an explicit Team OKR with measurable outcomes.
          </p>
        </div>
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          This activates the Team OKR immediately. Objective wording and key result definitions are fixed
          after activation (you can still update current values during the cycle).
        </p>
      </div>
    </form>
  )
}

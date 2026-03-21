"use client"

import {
  useActionState,
  useState,
  useCallback,
  useEffect,
  useRef,
  useTransition,
} from "react"
import { createCheckIn } from "@/lib/actions/check-in-actions"
import { concludeInitiative } from "@/lib/actions/initiative-actions"
import { InitiativeForm } from "@/components/initiative/initiative-form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Confidence } from "@/lib/domain/check-in"
import type { SupportingSignal, PrimaryOutcome } from "@/lib/domain/commitment"
import type { InitiativeView, ExpectedImpact } from "@/lib/domain/initiative"
import { cn } from "@/lib/utils"

interface GripFormProps {
  commitmentId: string
  teamId: string
  primaryOutcome: PrimaryOutcome
  signals: SupportingSignal[]
  initiatives: InitiativeView[]
}

/** True when primary + all signals match stored currents and interpretation is empty. */
function isNoMeaningfulChange(
  fd: FormData,
  primaryOutcome: PrimaryOutcome,
  signals: SupportingSignal[]
): boolean {
  const primaryRaw = fd.get("primaryOutcomeSnapshot")
  const primaryStr =
    typeof primaryRaw === "string" ? primaryRaw.trim() : ""
  const primaryEffective =
    primaryStr === "" ? primaryOutcome.current : parseFloat(primaryStr)
  if (!Number.isFinite(primaryEffective) || primaryEffective !== primaryOutcome.current) {
    return false
  }

  for (const s of signals) {
    const raw = fd.get(`signal_${s.id}`)
    const vStr = typeof raw === "string" ? raw.trim() : ""
    const vEffective = vStr === "" ? s.current : parseFloat(vStr)
    if (!Number.isFinite(vEffective) || vEffective !== s.current) {
      return false
    }
  }

  const rrRaw = fd.get("resultsReflection")
  const rr = typeof rrRaw === "string" ? rrRaw.trim() : ""
  return rr === ""
}

const CONFIDENCE_OPTIONS: { value: Confidence; label: string; style: string; activeStyle: string }[] = [
  {
    value: "HIGH",
    label: "High",
    style: "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600",
    activeStyle: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    style: "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600",
    activeStyle: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  {
    value: "LOW",
    label: "Low",
    style: "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600",
    activeStyle: "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
]

function GripSectionLabel({ label }: { label: string }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {label}
    </h2>
  )
}

function GripSectionHint({ text }: { text: string }) {
  return (
    <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">{text}</p>
  )
}

// Conclude modal used inline on check-in page
function ConcludeInitiativeModal({
  initiative,
  teamId,
  onClose,
  onConcluded,
}: {
  initiative: InitiativeView
  teamId: string
  onClose: () => void
  onConcluded: (initiativeId: string) => void
}) {
  const [concludeState, concludeAction, isConcluding] = useActionState(concludeInitiative, null)

  useEffect(() => {
    if (concludeState && "success" in concludeState && concludeState.success) {
      onConcluded(initiative.id)
      onClose()
    }
  }, [concludeState, onConcluded, initiative.id, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Conclude Initiative
        </h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {initiative.name}
        </p>
        <form action={concludeAction} className="mt-4 space-y-4">
          <input type="hidden" name="initiativeId" value={initiative.id} />
          <input type="hidden" name="teamId" value={teamId} />

          {concludeState?.error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {concludeState.error}
            </div>
          )}

          <Textarea
            name="conclusionReason"
            label="Why are we concluding this initiative?"
            placeholder="e.g., The original hypothesis was invalidated. We learned that..."
            required
            rows={3}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Did it influence the Primary Outcome as expected?
            </p>
            <div className="flex flex-wrap gap-2">
              {["Yes", "Partially", "No", "Too early to tell"].map((opt) => (
                <label key={opt} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="conclusionImpact"
                    value={opt}
                    className="h-3.5 w-3.5 border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600"
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isConcluding}>
              Cancel
            </Button>
            <Button type="submit" loading={isConcluding}>
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Initiative modal for check-in page
function AddInitiativeModal({
  commitmentId,
  teamId,
  signals,
  onClose,
  onCreated,
}: {
  commitmentId: string
  teamId: string
  signals: SupportingSignal[]
  onClose: () => void
  onCreated: (initiative: { id: string; name: string; hypothesis: string; expectedImpact: unknown; status: string; conclusionReason: string | null; conclusionImpact: string | null }) => void
}) {
  const handleSuccess = useCallback((initiative?: { id: string; name: string; hypothesis: string; expectedImpact: unknown; status: string; conclusionReason: string | null; conclusionImpact: string | null }) => {
    if (initiative) {
      onCreated(initiative)
    }
    onClose()
  }, [onClose, onCreated])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Add Team Initiative
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Cancel
          </button>
        </div>
        <InitiativeForm
          commitmentId={commitmentId}
          teamId={teamId}
          signals={signals}
          onSuccess={handleSuccess}
          variant="plain"
        />
      </div>
    </div>
  )
}

function parseExpectedImpact(raw: unknown): ExpectedImpact | null {
  if (!raw || typeof raw !== "object") return null
  const obj = raw as Record<string, unknown>
  if (typeof obj.primary !== "boolean") return null
  return {
    primary: obj.primary,
    signalIds: Array.isArray(obj.signalIds) ? obj.signalIds.filter((s): s is string => typeof s === "string") : [],
  }
}

export function GripForm({
  commitmentId,
  teamId,
  primaryOutcome,
  signals,
  initiatives: serverInitiatives,
}: GripFormProps) {
  const [state, formAction, isPending] = useActionState(createCheckIn, null)
  const [isSubmitting, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const skipNoChangeConfirmRef = useRef(false)
  const [showNoChangeConfirm, setShowNoChangeConfirm] = useState(false)
  const errorBannerRef = useRef<HTMLDivElement>(null)
  /**
   * Source of truth for submit: React Server Action form serialization can omit or
   * stale-read hidden fields; we merge this ref into FormData in onSubmit (see below).
   */
  const confidenceValueRef = useRef<Confidence | null>(null)
  const [confidence, setConfidence] = useState<Confidence | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)

  function selectConfidence(value: Confidence) {
    confidenceValueRef.current = value
    setConfidence(value)
  }
  const [localInitiatives, setLocalInitiatives] = useState<InitiativeView[]>(serverInitiatives)
  const [concludingInitiative, setConcludingInitiative] = useState<InitiativeView | null>(null)
  const [showAddInitiativeModal, setShowAddInitiativeModal] = useState(false)

  const now = new Date()
  const defaultDate = now.toISOString().slice(0, 10)
  const defaultTime = now.toTimeString().slice(0, 5)

  const showConfidencePrompt = confidence === "MEDIUM" || confidence === "LOW"
  const activeInitiatives = localInitiatives.filter((i) => i.status === "ACTIVE")
  const hasInitiatives = activeInitiatives.length > 0

  useEffect(() => {
    if ((state?.error || clientError) && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [state?.error, clientError])

  function handleInitiativeCreated(raw: { id: string; name: string; hypothesis: string; expectedImpact: unknown; status: string; conclusionReason: string | null; conclusionImpact: string | null }) {
    const newInit: InitiativeView = {
      id: raw.id,
      commitmentId,
      name: raw.name,
      hypothesis: raw.hypothesis,
      expectedImpact: parseExpectedImpact(raw.expectedImpact),
      status: raw.status as "ACTIVE" | "CONCLUDED",
      conclusionReason: raw.conclusionReason,
      conclusionImpact: raw.conclusionImpact,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setLocalInitiatives((prev) => [...prev, newInit])
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault()
          setClientError(null)
          const form = e.currentTarget
          const fd = new FormData(form)
          fd.set("confidence", confidenceValueRef.current ?? "")

          const bypassNoChangeDialog = skipNoChangeConfirmRef.current
          skipNoChangeConfirmRef.current = false

          if (
            !bypassNoChangeDialog &&
            isNoMeaningfulChange(fd, primaryOutcome, signals)
          ) {
            setShowNoChangeConfirm(true)
            return
          }

          startTransition(() => {
            try {
              formAction(fd)
            } catch (err) {
              console.error("[GripForm] submit", err)
              setClientError(
                "Something went wrong, but your check-in may have been saved."
              )
            }
          })
        }}
      >
        <input type="hidden" name="commitmentId" value={commitmentId} />
        <input type="hidden" name="teamId" value={teamId} />

        {(state?.error || clientError) && (
          <div ref={errorBannerRef} role="alert" className="mb-8 space-y-2">
            {state?.error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {state.error}
              </div>
            )}
            {clientError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                {clientError}
              </div>
            )}
          </div>
        )}

        {/* Date & time */}
        <div className="mb-10">
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="occurredDate"
                type="date"
                label="Date"
                defaultValue={defaultDate}
              />
              <Input
                name="occurredTime"
                type="time"
                label="Time"
                defaultValue={defaultTime}
              />
            </div>
          </Card>
        </div>

        {/* ── GRIP Sections ── */}
        <div className="space-y-10">

          {/* G — Goals Confidence */}
          <section>
            <GripSectionLabel label="G — Goals Confidence" />
            <GripSectionHint text="How confident are we in reaching our Primary Outcome?" />
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Base this on what we&apos;ve learned so far, not on effort or activity.
            </p>
            <div className="mt-4">
              <div className="flex gap-2">
                {CONFIDENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => selectConfidence(opt.value)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      confidence === opt.value ? opt.activeStyle : opt.style
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {confidence === null && (
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                  Select a confidence level to record your check-in.
                </p>
              )}

              {showConfidencePrompt && (
                <div className="mt-4">
                  <Textarea
                    name="confidenceReason"
                    label="What changed in our understanding?"
                    placeholder="Describe what shifted your confidence..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          </section>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* R — Results Progress */}
          <section>
            <GripSectionLabel label="R — Results Progress" />
            <GripSectionHint text="What's the current status of the Primary Outcome and Supporting Signals?" />

            {/* Evidence */}
            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-4">
                Evidence
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800/30">
                <div className="space-y-4">
                  {/* Primary Outcome */}
                  <div className="rounded-lg border border-zinc-300 bg-white p-5 dark:border-zinc-600 dark:bg-zinc-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      Primary Outcome
                    </p>
                    {primaryOutcome.outcomeStatement && (
                      <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {primaryOutcome.outcomeStatement}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Metric: {primaryOutcome.metric}
                    </p>
                    <div className="mt-3 flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">Current</span>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{primaryOutcome.current}</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">Target</span>
                        <p className="font-medium text-zinc-700 dark:text-zinc-300">{primaryOutcome.target}</p>
                      </div>
                      {primaryOutcome.baseline !== null && (
                        <div>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">Baseline</span>
                          <p className="text-zinc-500 dark:text-zinc-400">{primaryOutcome.baseline}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Input
                        name="primaryOutcomeSnapshot"
                        type="number"
                        step="any"
                        label="Updated value"
                        defaultValue={String(primaryOutcome.current)}
                        placeholder="e.g., 68"
                      />
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  {signals.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                        Progress Indicators
                      </p>
                      {signals.map((signal) => (
                        <div key={signal.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                          <input type="hidden" name="signalIds" value={signal.id} />
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              {signal.statement && (
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {signal.statement}
                                </p>
                              )}
                              <p className={cn(
                                "text-xs text-zinc-500 dark:text-zinc-400",
                                signal.statement ? "mt-0.5" : ""
                              )}>
                                {signal.metric}
                              </p>
                              <div className="mt-0.5 flex gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                                <span>Current: {signal.current}</span>
                                <span>Target: {signal.target}</span>
                                {signal.baseline !== null && <span>Baseline: {signal.baseline}</span>}
                              </div>
                            </div>
                            <Input
                              name={`signal_${signal.id}`}
                              type="number"
                              step="any"
                              defaultValue={String(signal.current)}
                              placeholder="Value"
                              className="h-8 w-28"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="mt-8 border-t border-zinc-100 pt-6 dark:border-zinc-800">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                Interpretation
              </div>
              <Textarea
                name="resultsReflection"
                label="What are we seeing in the Primary Outcome and Progress Indicators? What might be causing this movement (or lack of it)?"
                placeholder="Interpret the data. What does it mean? What might be driving the movement?"
                rows={4}
              />
            </div>
          </section>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* Related Team Initiatives */}
          <section>
            <GripSectionLabel label="Related Team Initiatives" />

            {hasInitiatives ? (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  {activeInitiatives.map((init) => (
                    <div
                      key={init.id}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {init.name}
                          </span>
                          <Badge variant="active">Active</Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConcludingInitiative(init)}
                          className="text-xs text-zinc-400 underline hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                        >
                          Conclude
                        </button>
                      </div>
                      {init.expectedImpact && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {init.expectedImpact.primary && (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              → Primary Outcome
                            </span>
                          )}
                          {init.expectedImpact.signalIds.length > 0 && (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              → {init.expectedImpact.signalIds.length} signal{init.expectedImpact.signalIds.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Textarea
                  name="initiativeReflection"
                  label="Did any initiative influence this movement? What did we learn?"
                  placeholder="Optional — share what you observed..."
                  rows={3}
                />

                <button
                  type="button"
                  onClick={() => setShowAddInitiativeModal(true)}
                  className="text-xs text-zinc-400 underline hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  + Add Team Initiative
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center dark:border-zinc-700">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No Team Initiatives defined yet.
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Is it time to introduce one?
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddInitiativeModal(true)}
                    className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                  >
                    + Add Team Initiative
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* I — Issues */}
          <section>
            <GripSectionLabel label="I — Issues" />
            <GripSectionHint text="What's getting in the way, and how can we overcome it?" />
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Include blockers, risks, or assumptions that may affect our ability to move the Primary Outcome.
            </p>
            <div className="mt-4">
              <Card>
                <Textarea
                  name="issues"
                  placeholder="Describe issues, blockers, risks, or concerns..."
                  rows={4}
                />
              </Card>
            </div>
          </section>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* P — Plan Forward */}
          <section>
            <GripSectionLabel label="P — Plan Forward" />
            <GripSectionHint text="What do we need to do or adjust to move ahead?" />
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Should we continue, adjust, stop, or add any Team Initiatives?
            </p>
            <div className="mt-4">
              <Card>
                <Textarea
                  name="planForward"
                  placeholder="Next actions, adjustments, experiments, changes in approach..."
                  rows={4}
                />
              </Card>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddInitiativeModal(true)}
                  className="text-xs text-zinc-400 underline hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  + Add Team Initiative
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Submit */}
        <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          {(state?.error || clientError) && (
            <div className="mb-4 space-y-2 md:hidden" role="alert">
              {state?.error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {state.error}
                </div>
              )}
              {clientError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  {clientError}
                </div>
              )}
            </div>
          )}
          {(isSubmitting || isPending) && (
            <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
              Saving check-in...
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting || isPending}
            disabled={confidence === null}
          >
            Record Check-in
          </Button>
        </div>
      </form>

      {showNoChangeConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="no-change-dialog-title"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900">
            <p
              id="no-change-dialog-title"
              className="text-sm text-zinc-700 dark:text-zinc-300"
            >
              Nothing changed. Do you still want to record this check-in?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowNoChangeConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowNoChangeConfirm(false)
                  skipNoChangeConfirmRef.current = true
                  formRef.current?.requestSubmit()
                }}
              >
                Save anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Conclude Initiative Modal */}
      {concludingInitiative && (
        <ConcludeInitiativeModal
          initiative={concludingInitiative}
          teamId={teamId}
          onClose={() => setConcludingInitiative(null)}
          onConcluded={(initId) => {
            setLocalInitiatives((prev) =>
              prev.map((i) =>
                i.id === initId
                  ? { ...i, status: "CONCLUDED" as const }
                  : i
              )
            )
          }}
        />
      )}

      {/* Add Initiative Modal */}
      {showAddInitiativeModal && (
        <AddInitiativeModal
          commitmentId={commitmentId}
          teamId={teamId}
          signals={signals}
          onClose={() => setShowAddInitiativeModal(false)}
          onCreated={handleInitiativeCreated}
        />
      )}
    </>
  )
}

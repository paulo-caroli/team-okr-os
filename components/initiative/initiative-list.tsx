"use client"

import { useState, useCallback } from "react"
import type { InitiativeView } from "@/lib/domain/initiative"
import type { SupportingSignal } from "@/lib/domain/commitment"
import { InitiativeCard } from "./initiative-card"
import { InitiativeForm } from "./initiative-form"
import { SectionHeader } from "@/components/ui/section-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

interface InitiativeListProps {
  initiatives: InitiativeView[]
  commitmentId: string
  teamId: string
  signals: SupportingSignal[]
  readOnly?: boolean
}

export function InitiativeList({
  initiatives,
  commitmentId,
  teamId,
  signals,
  readOnly = false,
}: InitiativeListProps) {
  const [showForm, setShowForm] = useState(false)
  const handleInitiativeFormSuccess = useCallback(() => {
    setShowForm(false)
  }, [])

  const active = initiatives.filter((i) => i.status === "ACTIVE")
  const concluded = initiatives.filter((i) => i.status === "CONCLUDED")

  return (
    <div>
      <SectionHeader
        title="Team Initiatives"
        description={initiatives.length > 0 ? `${initiatives.length} total` : "Optional"}
        className="mb-2"
        action={
          !readOnly ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancel" : "+ Add initiative"}
            </Button>
          ) : undefined
        }
      />
      <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
        Team Initiatives are the actions the team believes will influence the Primary Outcome.
        They are not projects or deliverables.
      </p>

      {!readOnly && showForm && (
        <div className="mb-4">
          <InitiativeForm
            commitmentId={commitmentId}
            teamId={teamId}
            signals={signals}
            onSuccess={handleInitiativeFormSuccess}
          />
        </div>
      )}

      {initiatives.length === 0 ? (
        readOnly ? (
          <EmptyState
            title="No initiatives were created during this cycle."
          />
        ) : (
          !showForm && (
            <EmptyState
              title="What action might influence the Primary Outcome?"
              action={
                <Button size="sm" onClick={() => setShowForm(true)}>
                  + Add Team Initiative
                </Button>
              }
            />
          )
        )
      ) : (
        <div className="space-y-2">
          {active.map((i) => (
            <InitiativeCard key={i.id} initiative={i} teamId={teamId} signals={signals} readOnly={readOnly} />
          ))}
          {concluded.length > 0 && active.length > 0 && (
            <div className="border-t border-zinc-100 pt-2 dark:border-zinc-800" />
          )}
          {concluded.map((i) => (
            <InitiativeCard key={i.id} initiative={i} teamId={teamId} signals={signals} readOnly={readOnly} />
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useActionState, useRef, useEffect } from "react"
import { addTeamMember, type InviteState } from "@/lib/actions/team-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { InviteMessage } from "./invite-message"

interface SetupInviteFormProps {
  teamId: string
}

export function SetupInviteForm({ teamId }: SetupInviteFormProps) {
  const [state, formAction, isPending] = useActionState<InviteState, FormData>(
    addTeamMember,
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state && "success" in state && state.success) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <div className="space-y-4">
      {state && "success" in state && state.success && (
        <div className="space-y-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
            {state.invited === "existing" ? (
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                <strong>{state.email}</strong> has been added to the team.
              </p>
            ) : (
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                Invitation created for <strong>{state.email}</strong>.
                They will join automatically when they sign up.
              </p>
            )}
          </div>

          {state.invited === "pending" && (
            <InviteMessage
              name={state.name}
              email={state.email}
              teamName={state.teamName}
            />
          )}
        </div>
      )}

      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="teamId" value={teamId} />

        {state && "error" in state && state.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="name"
            label="Name"
            placeholder="e.g., Ana Silva"
            required
          />
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="ana@company.com"
            required
          />
        </div>

        <Input
          name="dedicationPct"
          type="number"
          label="Dedication (%)"
          placeholder="e.g., 80"
          min={0}
          max={100}
        />

        <Button type="submit" size="sm" loading={isPending}>
          Add member
        </Button>
      </form>
    </div>
  )
}

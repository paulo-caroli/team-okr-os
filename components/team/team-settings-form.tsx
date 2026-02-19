"use client"

import { useActionState } from "react"
import { updateTeam } from "@/lib/actions/team-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TeamSettingsFormProps {
  teamId: string
  teamName: string
}

export function TeamSettingsForm({ teamId, teamName }: TeamSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateTeam, null)

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <input type="hidden" name="teamId" value={teamId} />

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      <Input
        name="name"
        label="Team name"
        defaultValue={teamName}
        required
      />

      <Button type="submit" size="sm" loading={isPending}>
        Save
      </Button>
    </form>
  )
}

"use client"

import { useActionState } from "react"
import { createTeam } from "@/lib/actions/team-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NewTeamPage() {
  const [state, formAction, isPending] = useActionState(createTeam, null)

  return (
    <div className="mx-auto max-w-md py-16">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Create a new team
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          A team is the foundation. Everything starts here.
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {state.error}
          </div>
        )}

        <Input
          name="name"
          label="Team name"
          placeholder="e.g., Platform Engineering, Growth Squad"
          required
          autoFocus
        />

        <Input
          name="dedicationPct"
          type="number"
          label="Your dedication to this team (%)"
          placeholder="e.g., 80"
          min={0}
          max={100}
          required
        />

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isPending}>
            Create team
          </Button>
          <Link href="/team">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}

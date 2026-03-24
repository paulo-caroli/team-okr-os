"use client"

import { useState, useActionState } from "react"
import { updateCheckInCadence } from "@/lib/actions/team-actions"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
]

const DAY_OPTIONS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
]

interface CheckInCadenceFormProps {
  teamId: string
  defaultFrequency?: string | null
  defaultDay?: string | null
  defaultTime?: string | null
}

export function CheckInCadenceForm({
  teamId,
  defaultFrequency,
  defaultDay,
  defaultTime,
}: CheckInCadenceFormProps) {
  const [state, formAction, isPending] = useActionState(updateCheckInCadence, null)
  const [frequency, setFrequency] = useState(defaultFrequency ?? "")

  const showDayField = frequency === "weekly" || frequency === "bi-weekly"

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <input type="hidden" name="teamId" value={teamId} />

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      <Select
        name="checkInFrequency"
        label="Frequency"
        options={FREQUENCY_OPTIONS}
        placeholder="Select frequency"
        defaultValue={defaultFrequency ?? ""}
        onChange={(e) => setFrequency(e.target.value)}
        required
      />

      {showDayField && (
        <Select
          name="checkInDay"
          label="Day"
          options={DAY_OPTIONS}
          placeholder="Select day"
          defaultValue={defaultDay ?? ""}
          required
        />
      )}

      <Input
        name="checkInTime"
        label="Time (optional)"
        type="time"
        defaultValue={defaultTime ?? ""}
      />

      <Button type="submit" size="sm" loading={isPending}>
        Save
      </Button>
    </form>
  )
}

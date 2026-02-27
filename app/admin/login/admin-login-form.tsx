"use client"

import { useActionState } from "react"
import { loginAction } from "@/lib/admin-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AdminLoginForm() {
  const [state, formAction] = useActionState(loginAction, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <Input
        type="password"
        name="password"
        placeholder="Password"
        required
        autoFocus
      />
      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  )
}

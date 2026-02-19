"use client"

import { useActionState } from "react"
import { signUpAction } from "@/lib/actions/auth-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Team OKR OS
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Create your account
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {state.error}
            </div>
          )}

          <Input
            name="name"
            type="text"
            label="Name"
            placeholder="Your name"
            required
            autoComplete="name"
          />

          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="you@team.com"
            required
            autoComplete="email"
          />

          <Input
            name="password"
            type="password"
            label="Password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
          />

          <Button type="submit" loading={isPending} className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

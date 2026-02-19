"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOutAction } from "@/lib/actions/auth-actions"
import { Button } from "@/components/ui/button"

interface AppNavProps {
  userName: string
  teams: Array<{ id: string; name: string }>
}

export function AppNav({ userName, teams }: AppNavProps) {
  const pathname = usePathname()

  const currentTeamId = pathname.match(/\/team\/([^/]+)/)?.[1]
  const currentTeam = teams.find((t) => t.id === currentTeamId)

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/team"
            className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            Team OKR OS
          </Link>
          {currentTeam && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">/</span>
              <Link
                href={`/team/${currentTeam.id}`}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {currentTeam.name}
              </Link>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <Link
                href={`/team/${currentTeam.id}/settings`}
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                Edit team
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {userName}
          </span>
          <form action={signOutAction}>
            <Button variant="ghost" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}

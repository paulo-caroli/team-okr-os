"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { clsx } from "clsx"

interface TeamNavProps {
  teamId: string
}

export function TeamNav({ teamId }: TeamNavProps) {
  const pathname = usePathname()

  const tabs = [
    {
      label: "Commitment",
      href: `/team/${teamId}`,
      isActive:
        pathname === `/team/${teamId}` ||
        pathname.startsWith(`/team/${teamId}/commitment`),
    },
    {
      label: "History",
      href: `/team/${teamId}/history`,
      isActive: pathname.startsWith(`/team/${teamId}/history`),
    },
    {
      label: "Settings",
      href: `/team/${teamId}/settings`,
      isActive:
        pathname === `/team/${teamId}/settings` ||
        pathname.startsWith(`/team/${teamId}/settings`),
    },
  ]

  return (
    <nav className="mt-4 flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={clsx(
            "-mb-px border-b-2 pb-2 text-sm font-medium transition-colors",
            tab.isActive
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { ActiveUserRow } from "@/lib/admin-metrics"

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d))
}

export function ActiveUsersTable({ rows }: { rows: ActiveUserRow[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function copyEmail(email: string, userId: string) {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedId(userId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // ignore
    }
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No active users in the last 7 days.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Name
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Team(s)
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Last activity
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Check-ins
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Initiatives
            </th>
            <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
              Copy
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.userId}
              className="border-b border-zinc-100 dark:border-zinc-800/50"
            >
              <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                {row.name}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.email}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.teams.join(", ") || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {formatDate(row.lastActivityAt)}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.checkInCount}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.initiativeCount}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyEmail(row.email, row.userId)}
                >
                  {copiedId === row.userId ? "Copied" : "Copy email"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

"use client"

import type { CommitmentAdminRow } from "@/lib/admin-metrics"

function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d))
}

function formatStatus(status: CommitmentAdminRow["status"]) {
  if (status === "COMPLETED") return "CLOSED"
  return status
}

export function TeamCommitmentsTable({ rows }: { rows: CommitmentAdminRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No commitments found.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              User
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Team
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Commitment
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Status
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Check-ins
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Initiatives
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              Last activity
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.commitmentId}
              className="border-b border-zinc-100 dark:border-zinc-800/50"
            >
              <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                {row.ownerName || row.email || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.email || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.teamName}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.commitmentTitle}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {formatStatus(row.status)}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.checkInCount}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.initiativeCount}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {formatDateTime(row.lastActivityAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


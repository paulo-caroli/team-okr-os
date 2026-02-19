"use client"

import { cancelInvitation } from "@/lib/actions/team-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface PendingInvitation {
  id: string
  name: string | null
  email: string
  dedicationPct: number | null
  createdAt: Date
}

interface PendingInvitationsProps {
  invitations: PendingInvitation[]
  teamId: string
  isOwner: boolean
}

export function PendingInvitations({
  invitations,
  teamId,
  isOwner,
}: PendingInvitationsProps) {
  if (invitations.length === 0) return null

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Pending invitations
      </h3>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-zinc-300 text-sm text-zinc-400 dark:border-zinc-600 dark:text-zinc-500">
                {invitation.name ? invitation.name.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {invitation.name || invitation.email}
                  </span>
                  <Badge variant="paused">Pending</Badge>
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {invitation.name ? `${invitation.email} · ` : ""}
                  Invited {formatDate(invitation.createdAt)}
                  {invitation.dedicationPct != null &&
                    ` · ${invitation.dedicationPct}% committed to this team`}
                </span>
              </div>
            </div>

            {isOwner && (
              <form action={() => cancelInvitation(teamId, invitation.id)}>
                <Button variant="ghost" size="sm" type="submit">
                  Cancel
                </Button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

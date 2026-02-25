"use client"

import { useState } from "react"
import type { TeamMemberInfo } from "@/lib/domain/team"
import { removeTeamMember } from "@/lib/actions/team-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MemberListProps {
  members: TeamMemberInfo[]
  teamId: string
  isOwner: boolean
}

export function MemberList({ members, teamId, isOwner }: MemberListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between py-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {member.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {member.user.name}
                </span>
                {member.role === "OWNER" && (
                  <Badge variant="default">Owner</Badge>
                )}
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {member.user.email}
                {member.dedicationPct != null &&
                  ` · ${member.dedicationPct}% committed to this team`}
              </span>
            </div>
          </div>

          {isOwner && member.role !== "OWNER" && (
            confirmingId === member.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Are you sure?
                </span>
                <form action={() => removeTeamMember(teamId, member.id)}>
                  <Button variant="destructive" size="sm" type="submit">
                    Confirm
                  </Button>
                </form>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingId(member.id)}
              >
                Remove
              </Button>
            )
          )}
        </div>
      ))}
    </div>
  )
}

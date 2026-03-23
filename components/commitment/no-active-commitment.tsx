import { Button } from "@/components/ui/button"
import type { CommitmentView } from "@/lib/domain/commitment"
import Link from "next/link"

interface NoActiveCommitmentProps {
  teamId: string
  lastCommitment?: CommitmentView | null
}

export function NoActiveCommitment({
  teamId,
  lastCommitment,
}: NoActiveCommitmentProps) {
  return (
    <div className="mx-auto max-w-2xl py-24 text-center">
      {lastCommitment?.status === "ABANDONED" && (
        <div className="mb-10 rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-left dark:border-amber-800/50 dark:bg-amber-900/10">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            The previous commitment was abandoned.
          </p>
          {lastCommitment.abandonmentReason && (
            <p className="mt-1.5 text-sm leading-relaxed text-amber-700 dark:text-amber-400">
              &ldquo;{lastCommitment.abandonmentReason}&rdquo;
            </p>
          )}
        </div>
      )}

      {lastCommitment?.status === "COMPLETED" && (
        <div className="mb-10 rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-4 text-left dark:border-emerald-800/50 dark:bg-emerald-900/10">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            The previous commitment was completed.
          </p>
          {lastCommitment.completionNotes && (
            <div className="mt-2 border-t border-emerald-200 pt-2 dark:border-emerald-800/50">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Key learnings
              </p>
              <p className="text-sm leading-relaxed text-emerald-700 dark:text-emerald-400">
                {lastCommitment.completionNotes}
              </p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Team Commitment
      </p>

      <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        This team is operating without a commitment.
      </h1>

      <p className="mt-4 text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
        Execution without commitment leads to activity — not impact.
        <br />
        Define the team objectives and key results this cycle will move.
      </p>

      <div className="mt-8">
        <Link href={`/team/${teamId}/commitment/new`}>
          <Button size="lg">Start New Commitment</Button>
        </Link>
      </div>

      <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
        One active commitment per team at a time — with one or more objectives inside it.
      </p>

      <div className="mt-6 flex items-center justify-center gap-4">
        {lastCommitment && (
          <Link
            href={`/team/${teamId}/commitment/new?cloneFrom=${lastCommitment.id}`}
            className="text-sm text-zinc-400 underline hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Start from previous commitment
          </Link>
        )}
        <Link
          href={`/team/${teamId}/settings`}
          className="text-sm text-zinc-400 underline hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          Edit team members
        </Link>
      </div>
    </div>
  )
}

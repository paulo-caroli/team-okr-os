import { formatDate } from "@/lib/utils"

interface CompletionNoticeProps {
  notes: string | null
  completedAt: Date | null
}

export function CompletionNotice({ notes, completedAt }: CompletionNoticeProps) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-800/50 dark:bg-emerald-900/10">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          This commitment was completed
          {completedAt && (
            <span className="font-normal text-emerald-600 dark:text-emerald-400">
              {" "}on {formatDate(completedAt)}
            </span>
          )}
        </p>
      </div>

      {notes && (
        <div className="mt-3 border-t border-emerald-200 pt-3 dark:border-emerald-800/50">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Key learnings
          </p>
          <p className="text-sm leading-relaxed text-emerald-700 dark:text-emerald-400">
            {notes}
          </p>
        </div>
      )}
    </div>
  )
}

import { formatDate } from "@/lib/utils"

interface AbandonmentNoticeProps {
  reason: string | null
  abandonedAt: Date | null
}

export function AbandonmentNotice({ reason, abandonedAt }: AbandonmentNoticeProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 dark:border-red-800/50 dark:bg-red-900/10">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-red-800 dark:text-red-300">
          This commitment was abandoned
          {abandonedAt && (
            <span className="font-normal text-red-600 dark:text-red-400">
              {" "}on {formatDate(abandonedAt)}
            </span>
          )}
        </p>
      </div>

      {reason && (
        <p className="mt-2 text-sm leading-relaxed text-red-700 dark:text-red-400">
          &ldquo;{reason}&rdquo;
        </p>
      )}
    </div>
  )
}

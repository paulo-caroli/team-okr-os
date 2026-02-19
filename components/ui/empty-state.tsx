import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700",
        className
      )}
    >
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

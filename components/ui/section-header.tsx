import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

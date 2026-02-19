import { cn } from "@/lib/utils"

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

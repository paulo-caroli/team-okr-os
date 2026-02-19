import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "active" | "paused" | "completed" | "abandoned" | "yes" | "no" | "unknown"

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  abandoned: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  yes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  no: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  unknown: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

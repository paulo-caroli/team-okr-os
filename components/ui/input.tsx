import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        {hint && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500",
            error && "border-red-300 focus:border-red-400 focus:ring-red-400/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = "Input"

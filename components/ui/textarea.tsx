import { forwardRef, type TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || props.name

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        {hint && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "flex min-h-[100px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500",
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

Textarea.displayName = "Textarea"

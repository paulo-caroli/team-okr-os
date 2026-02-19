import { forwardRef, type SelectHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || props.name

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
            error && "border-red-300 focus:border-red-400 focus:ring-red-400/20",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)

Select.displayName = "Select"

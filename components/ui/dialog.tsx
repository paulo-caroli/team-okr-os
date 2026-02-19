"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "w-full max-w-md rounded-xl border border-zinc-200 bg-white p-0 shadow-lg backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900",
        className
      )}
    >
      <div className="p-6">{children}</div>
    </dialog>
  )
}

interface DialogHeaderProps {
  title: string
  description?: string
}

export function DialogHeader({ title, description }: DialogHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
    </div>
  )
}

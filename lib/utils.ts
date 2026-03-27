import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function daysRemaining(endDate: Date): number {
  const now = new Date()
  const end = new Date(endDate)
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function cycleProgress(startDate: Date, endDate: Date): number {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()
  if (total <= 0) return 100
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface InviteMessageProps {
  name: string | null
  email: string
  teamName?: string
}

export function InviteMessage({ name, email, teamName }: InviteMessageProps) {
  const [copied, setCopied] = useState(false)

  const signUpUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sign-up`
      : "/sign-up"

  const greeting = name ? `Hi ${name},` : `Hi,`
  const teamLabel = teamName ? `the "${teamName}" team` : "a team"

  const message = [
    greeting,
    "",
    `You have been added to ${teamLabel} on Team OKR OS.`,
    "",
    `Please sign up or sign in at the link below using your email (${email}) so you can view and contribute to the team's commitments, initiatives, and check-ins.`,
    "",
    signUpUrl,
    "",
    "Once you sign in, you will have full access to everything the team is working on.",
  ].join("\n")

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = message
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Share this message with {name || email}
        </span>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleCopy}
        >
          {copied ? "Copied" : "Copy message"}
        </Button>
      </div>
      <pre className="whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {message}
      </pre>
    </div>
  )
}

import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function LandingPage() {
  const session = await auth()

  if (session) redirect("/team")

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-24">

        {/* Section 1 — Hero */}
        <section>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Team OKR OS
          </h1>
          <p className="mt-4 text-xl text-zinc-500 dark:text-zinc-400">
            The Operating Discipline for Outcome-Driven Teams
          </p>
          <p className="mt-6 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            A focused system that helps teams commit to one measurable outcome
            — and run disciplined impact cycles around it.
          </p>
          <div className="mt-8">
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start a Team Commitment
            </Link>
            <div className="mt-4">
              <Link
                href="/sign-in"
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2 — What This Is */}
        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            What This Is
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
            This is not OKR software.
            <br />
            It is an operating layer for teams who want to take responsibility
            for measurable outcomes.
          </p>
          <ul className="mt-6 space-y-3 text-zinc-700 dark:text-zinc-300">
            <li>One Primary Outcome per cycle</li>
            <li>Structured impact conversations (GRIP)</li>
            <li>Learning captured across commitment cycles</li>
          </ul>
        </section>

        {/* Section 3 — What This Is Not */}
        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            What This Is Not
          </h2>
          <ul className="mt-6 space-y-3 text-zinc-700 dark:text-zinc-300">
            <li>Not a task manager</li>
            <li>Not a backlog tool</li>
            <li>Not a KPI dashboard</li>
            <li>Not a cascade engine</li>
          </ul>
        </section>

        {/* Section 4 — Who It's For */}
        <section className="mt-20">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Who It&#39;s For
          </h2>
          <ul className="mt-6 space-y-3 text-zinc-700 dark:text-zinc-300">
            <li>Teams that want clarity, not dashboards</li>
            <li>Teams that want responsibility, not reporting</li>
            <li>Teams that want outcome focus, not output tracking</li>
          </ul>
        </section>

        {/* Section 5 — Authority Footer */}
        <section className="mt-24 mb-24">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Built by Paulo Caroli — author of Lean Inception and Team OKR.
          </p>
        </section>

      </main>
    </div>
  )
}

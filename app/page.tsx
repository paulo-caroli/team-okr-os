import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function LandingPage() {
  const session = await auth()

  if (session) redirect("/team")

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-24">

        {/* Hero */}
        <section>
          <p className="text-xs font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Early Beta — expect continuous improvements
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-100">
            Team OKR OS
          </h1>
          <p className="mt-4 text-xl text-zinc-500 dark:text-zinc-400">
            The Operating Discipline for Outcome-Driven Teams
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            A simple, focused system to help teams define clear Team OKRs,
            track measurable progress, and run disciplined impact cycles.
          </p>
          <div className="mt-8 flex items-center gap-6">
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start a Team OKR
            </Link>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* What This Is */}
        <section className="mt-24">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            What This Is
          </h2>
          <p className="mt-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
            This is not OKR software.
          </p>
          <p className="mt-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
            It is an operating layer for teams that take responsibility
            for measurable outcomes.
          </p>
          <ul className="mt-6 space-y-3 text-zinc-700 dark:text-zinc-300">
            <li className="flex gap-3">
              <span className="shrink-0 text-zinc-400 dark:text-zinc-500">—</span>
              <span>Team OKRs: one clear objective with measurable key results</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-zinc-400 dark:text-zinc-500">—</span>
              <span>Structured check-in conversations</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-zinc-400 dark:text-zinc-500">—</span>
              <span>Continuous learning across cycles</span>
            </li>
          </ul>
        </section>

        {/* What This Is Not */}
        <section className="mt-24">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            What This Is Not
          </h2>
          <ul className="mt-6 space-y-3 text-zinc-500 dark:text-zinc-400">
            <li>Not a task manager</li>
            <li>Not a backlog tool</li>
            <li>Not a KPI dashboard</li>
            <li>Not a cascade engine</li>
          </ul>
        </section>

        {/* Who It's For */}
        <section className="mt-24">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Who It&#39;s For
          </h2>
          <ul className="mt-6 space-y-3 text-zinc-700 dark:text-zinc-300">
            <li className="flex gap-3">
              <span className="shrink-0 text-zinc-400 dark:text-zinc-500">—</span>
              <span>Teams that want clarity, not dashboards</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-zinc-400 dark:text-zinc-500">—</span>
              <span>Teams that take ownership, not just report progress</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-zinc-400 dark:text-zinc-500">—</span>
              <span>Teams focused on outcomes, not output</span>
            </li>
          </ul>
        </section>

        {/* About this Beta */}
        <section className="mt-24 rounded-lg border border-zinc-200 px-6 py-8 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            About this Beta
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              This is an early beta of Team OKR OS.
            </p>
            <p>
              Built and maintained by{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Paulo Caroli</span>
              {" "}— author of{" "}
              <a
                href="https://caroli.org/en/livro/team-okr/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:decoration-zinc-400"
              >
                Team OKR in Action
              </a>.
            </p>
            <p>
              Paulo has been using this app with teams to help them define
              Team OKRs, track initiatives, and run check-ins that actually
              drive outcomes.
            </p>
            <p>
              This is not intended to become a full SaaS product or replace
              existing tools. It is a simple and direct way to put Team OKR
              into practice.
            </p>
            <p className="pt-2 text-zinc-500 dark:text-zinc-500">
              Have feedback? Email directly:{" "}
              <a
                href="mailto:paulo@caroli.org"
                className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:decoration-zinc-400"
              >
                paulo@caroli.org
              </a>
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mt-24 mb-16 text-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start a Team OKR
          </Link>
        </section>

      </main>
    </div>
  )
}

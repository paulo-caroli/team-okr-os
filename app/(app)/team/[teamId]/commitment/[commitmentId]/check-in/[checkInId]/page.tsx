import { requireTeamAccess } from "@/lib/auth-guard"
import { getCheckIn } from "@/lib/queries/check-in-queries"
import { CheckInDetail } from "@/components/check-in/check-in-detail"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function CheckInDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; commitmentId: string; checkInId: string }>
}) {
  const { teamId, commitmentId, checkInId } = await params
  await requireTeamAccess(teamId)

  const checkIn = await getCheckIn(checkInId)
  if (!checkIn || checkIn.commitmentId !== commitmentId) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/team/${teamId}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
        >
          ← Back to Team OKR
        </Link>
      </div>

      <CheckInDetail checkIn={checkIn} />
    </div>
  )
}

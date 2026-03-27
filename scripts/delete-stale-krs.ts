import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const KR_IDS_TO_DELETE = [
  "cmn6e4dxo0005f213cthfuaky",
  "cmn6e4dxo0006f213051xpgsf",
  "cmn6e4dxo0008f213ts3ijob9",
]

async function main() {
  console.log("=== Deleting stale Key Results ===")
  console.log("IDs:", KR_IDS_TO_DELETE)
  console.log("")

  // 1. Verify these KRs exist and belong to the expected user
  const krs = await prisma.keyResult.findMany({
    where: { id: { in: KR_IDS_TO_DELETE } },
    include: {
      objective: {
        include: {
          teamOkr: {
            include: {
              team: {
                include: {
                  members: { include: { user: { select: { email: true } } } },
                },
              },
            },
          },
        },
      },
    },
  })

  console.log(`Found ${krs.length} of ${KR_IDS_TO_DELETE.length} KRs`)
  for (const kr of krs) {
    const emails = kr.objective.teamOkr.team.members.map((m) => m.user.email)
    console.log(`  KR: ${kr.id} — "${kr.title}" (team members: ${emails.join(", ")})`)
  }

  if (krs.length === 0) {
    console.log("Nothing to delete.")
    return
  }

  // 2. Clean initiative.expectedImpact references
  const initiatives = await prisma.initiative.findMany({
    where: { expectedImpact: { not: undefined } },
    select: { id: true, expectedImpact: true },
  })

  let initUpdated = 0
  for (const init of initiatives) {
    const impact = init.expectedImpact as { keyResultIds?: string[] } | null
    if (!impact?.keyResultIds) continue
    const filtered = impact.keyResultIds.filter((id) => !KR_IDS_TO_DELETE.includes(id))
    if (filtered.length !== impact.keyResultIds.length) {
      await prisma.initiative.update({
        where: { id: init.id },
        data: { expectedImpact: { keyResultIds: filtered } },
      })
      initUpdated++
      console.log(`  Cleaned initiative ${init.id}: removed ${impact.keyResultIds.length - filtered.length} stale KR ref(s)`)
    }
  }
  console.log(`Updated ${initUpdated} initiative(s)`)

  // 3. Clean GripSession.keyResultSnapshots references
  const sessions = await prisma.gripSession.findMany({
    select: { id: true, keyResultSnapshots: true },
  })

  let sessionsUpdated = 0
  for (const session of sessions) {
    const snapshots = session.keyResultSnapshots as Record<string, number> | null
    if (!snapshots) continue
    let changed = false
    const cleaned = { ...snapshots }
    for (const krId of KR_IDS_TO_DELETE) {
      if (krId in cleaned) {
        delete cleaned[krId]
        changed = true
      }
    }
    if (changed) {
      await prisma.gripSession.update({
        where: { id: session.id },
        data: { keyResultSnapshots: cleaned },
      })
      sessionsUpdated++
      console.log(`  Cleaned check-in session ${session.id}`)
    }
  }
  console.log(`Updated ${sessionsUpdated} check-in session(s)`)

  // 4. Delete the Key Results
  const result = await prisma.keyResult.deleteMany({
    where: { id: { in: KR_IDS_TO_DELETE } },
  })
  console.log(`\nDeleted ${result.count} Key Result(s)`)
  console.log("=== Done ===")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

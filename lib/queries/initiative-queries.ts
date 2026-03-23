import { db } from "@/lib/db"
import type { InitiativeView, ExpectedImpact } from "@/lib/domain/initiative"

function parseExpectedImpact(raw: unknown): ExpectedImpact | null {
  if (!raw || typeof raw !== "object") return null
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.keyResultIds)) return null
  return {
    keyResultIds: obj.keyResultIds.filter((s): s is string => typeof s === "string"),
  }
}

export async function getInitiatives(
  teamOkrId: string
): Promise<InitiativeView[]> {
  const initiatives = await db.initiative.findMany({
    where: { teamOkrId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  return initiatives.map((i) => ({
    id: i.id,
    commitmentId: i.teamOkrId,
    name: i.name,
    hypothesis: i.hypothesis,
    expectedImpact: parseExpectedImpact(i.expectedImpact),
    status: i.status,
    conclusionReason: i.conclusionReason,
    conclusionImpact: i.conclusionImpact,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  }))
}

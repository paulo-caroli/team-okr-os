export type Confidence = "HIGH" | "MEDIUM" | "LOW"

export interface KeyResultSnapshot {
  keyResultId: string
  label: string
  value: number
}

export interface CheckInView {
  id: string
  commitmentId: string
  occurredAt: Date
  confidence: Confidence
  confidenceReason: string | null
  keyResultSnapshots: KeyResultSnapshot[]
  resultsReflection: string
  initiativeReflection: string | null
  issues: string
  planForward: string
  createdAt: Date
}

export type Confidence = "HIGH" | "MEDIUM" | "LOW"

export interface SignalSnapshot {
  signalId: string
  metric: string
  value: number
}

export interface CheckInView {
  id: string
  commitmentId: string
  occurredAt: Date
  confidence: Confidence
  confidenceReason: string | null
  primaryOutcomeSnapshot: number
  resultsReflection: string
  initiativeReflection: string | null
  issues: string
  planForward: string
  supportingSignalSnapshots: SignalSnapshot[]
  createdAt: Date
}

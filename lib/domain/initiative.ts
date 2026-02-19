export type InitiativeStatus = "ACTIVE" | "CONCLUDED"

export interface ExpectedImpact {
  primary: boolean
  signalIds: string[]
}

export interface InitiativeView {
  id: string
  commitmentId: string
  name: string
  hypothesis: string
  expectedImpact: ExpectedImpact | null
  status: InitiativeStatus
  conclusionReason: string | null
  conclusionImpact: string | null
  createdAt: Date
  updatedAt: Date
}

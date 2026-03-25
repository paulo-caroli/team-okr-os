export type InitiativeStatus = "NOT_STARTED" | "IN_PROGRESS" | "CONCLUDED"

export interface ExpectedImpact {
  keyResultIds: string[]
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

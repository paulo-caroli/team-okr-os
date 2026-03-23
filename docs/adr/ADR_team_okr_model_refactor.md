# ADR: Team OKR model refactor

## Context

The product previously modeled each commitment as:

- One embedded **Primary Outcome** (metric, baseline, target, current)
- **Supporting signals** (“progress indicators”) as child rows

That mixed a single headline metric with supporting measures and only allowed **one** outcome narrative per commitment cycle. It also diverged from the **Team OKR** mental model (objectives + key results) used in practice.

## Decision

Adopt the **Team OKR** structure:

- **Team Objective** — A clear, specific outcome the team commits to for the cycle (stored as `Objective`, scoped to `TeamCommitment`).
- **Key Results** — Measurable outcomes that show progress toward the objective (stored as `KeyResult`, children of `Objective`).
- **Multiple objectives** per commitment are supported (`1:N` objectives, each with `1:N` key results).

Terminology in the UI aligns with this model (“Team Objective”, “Key Result”). Objective-level progress is **derived** from key results (average of per–key-result progress), not from a separate primary metric column.

Check-ins (GRIP) snapshot **per key result** in `GripSession.keyResultSnapshots` (JSON map of key result id → value).

Initiatives link expected impact to **key result ids** (`expectedImpact.keyResultIds`).

## Consequences

- **Clearer mental model** for users and closer alignment with outcome-driven OKR practice.
- **More flexibility** — teams can run 1–2 (or more) objectives per cycle with 2–4 key results each (soft guidance in UI, not hard limits).
- **Data migration required** — legacy primary outcome becomes one objective plus a key result for the primary metric; legacy supporting signals become additional key results on that objective.
- **Breaking schema change** — `SupportingSignal`, embedded primary columns on `TeamCommitment`, and `GripSession.primaryOutcomeSnapshot` / `supportingSignalSnapshots` are removed after migration.

## Note on `team_id` vs `commitment_id`

Objectives are keyed to **`TeamCommitment`** (`commitmentId`), not `Team` directly, because this product’s “OKR set” is always defined **per commitment cycle**. The team is implied via `TeamCommitment.teamId`.

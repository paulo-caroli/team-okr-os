-- Multiple Team OKRs per team: DRAFT status + isPrimary flag.
-- Table remains "TeamCommitment"; FK columns remain commitmentId (mapped in Prisma).

ALTER TYPE "CommitmentStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

ALTER TABLE "TeamCommitment" ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- Exactly one primary among ACTIVE Team OKRs per team (earliest created wins).
WITH first_active AS (
  SELECT DISTINCT ON ("teamId") id, "teamId"
  FROM "TeamCommitment"
  WHERE status = 'ACTIVE'
  ORDER BY "teamId", "createdAt" ASC
)
UPDATE "TeamCommitment" t
SET "isPrimary" = true
FROM first_active f
WHERE t.id = f.id;

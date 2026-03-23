-- Short title + full team objective at Team OKR (TeamCommitment) level
ALTER TABLE "TeamCommitment" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "TeamCommitment" ADD COLUMN IF NOT EXISTS "teamObjective" TEXT NOT NULL DEFAULT '';

-- Backfill title for existing rows (teamObjective may be filled separately by users)
UPDATE "TeamCommitment" c
SET "title" = COALESCE(
  NULLIF(TRIM(c."cycleLabel"), ''),
  (
    SELECT NULLIF(TRIM(o.title), '')
    FROM "Objective" o
    WHERE o."commitmentId" = c.id
    ORDER BY o."sortOrder" ASC
    LIMIT 1
  ),
  'Team OKR'
)
WHERE TRIM(COALESCE(c."title", '')) = '';

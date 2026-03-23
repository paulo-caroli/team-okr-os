-- Strategic Context removed; Team Objective carries outcome + why it matters
-- Preserve text for rows that never had teamObjective set
UPDATE "TeamCommitment"
SET "teamObjective" = "strategicIntent"
WHERE TRIM(COALESCE("teamObjective", '')) = ''
  AND TRIM(COALESCE("strategicIntent", '')) <> '';

ALTER TABLE "TeamCommitment" DROP COLUMN IF EXISTS "strategicIntent";

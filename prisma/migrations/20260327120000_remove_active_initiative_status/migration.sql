-- 1. Create new enum (without ACTIVE)
CREATE TYPE "InitiativeStatus_new" AS ENUM (
  'NOT_STARTED',
  'IN_PROGRESS',
  'CONCLUDED'
);

-- 2. Remove default temporarily
ALTER TABLE "Initiative"
  ALTER COLUMN "status" DROP DEFAULT;

-- 3. Convert column using safe mapping
ALTER TABLE "Initiative"
  ALTER COLUMN "status" TYPE "InitiativeStatus_new"
  USING (
    CASE
      WHEN status = 'ACTIVE' THEN 'IN_PROGRESS'::text
      ELSE status::text
    END
  )::"InitiativeStatus_new";

-- 4. Restore default
ALTER TABLE "Initiative"
  ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';

-- 5. Drop old enum
DROP TYPE "InitiativeStatus";

-- 6. Rename new enum
ALTER TYPE "InitiativeStatus_new" RENAME TO "InitiativeStatus";

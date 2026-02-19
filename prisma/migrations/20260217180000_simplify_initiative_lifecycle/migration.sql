-- Step 1: Map old statuses to new simplified model
UPDATE "Initiative" SET "status" = 'CONCLUDED' WHERE "status" IN ('VALIDATED', 'INVALIDATED', 'STOPPED', 'PIVOTED');

-- Step 2: Create new table with updated schema
CREATE TABLE "new_Initiative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commitmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "expectedImpact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "conclusionReason" TEXT,
    "conclusionImpact" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Initiative_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "TeamCommitment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 3: Copy data (dropping ownerId)
INSERT INTO "new_Initiative" ("id", "commitmentId", "name", "hypothesis", "expectedImpact", "status", "createdAt", "updatedAt")
SELECT "id", "commitmentId", "name", "hypothesis", "expectedImpact", "status", "createdAt", "updatedAt"
FROM "Initiative";

-- Step 4: Drop old table and rename new
DROP TABLE "Initiative";
ALTER TABLE "new_Initiative" RENAME TO "Initiative";

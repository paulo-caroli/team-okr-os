/*
  Warnings:

  - Added the required column `resultsReflection` to the `GripSession` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GripSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commitmentId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "confidence" TEXT NOT NULL,
    "primaryOutcomeSnapshot" REAL NOT NULL,
    "resultsReflection" TEXT NOT NULL,
    "issues" TEXT NOT NULL,
    "planForward" TEXT NOT NULL,
    "supportingSignalSnapshots" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GripSession_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "TeamCommitment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GripSession" ("commitmentId", "confidence", "createdAt", "id", "issues", "occurredAt", "planForward", "primaryOutcomeSnapshot", "supportingSignalSnapshots", "updatedAt") SELECT "commitmentId", "confidence", "createdAt", "id", "issues", "occurredAt", "planForward", "primaryOutcomeSnapshot", "supportingSignalSnapshots", "updatedAt" FROM "GripSession";
DROP TABLE "GripSession";
ALTER TABLE "new_GripSession" RENAME TO "GripSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

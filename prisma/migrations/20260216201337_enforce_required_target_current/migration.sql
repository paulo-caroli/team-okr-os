/*
  Warnings:

  - Made the column `current` on table `SupportingSignal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `target` on table `SupportingSignal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `primaryCurrent` on table `TeamCommitment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `primaryTarget` on table `TeamCommitment` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SupportingSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commitmentId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "baseline" REAL,
    "target" REAL NOT NULL,
    "current" REAL NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupportingSignal_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "TeamCommitment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SupportingSignal" ("baseline", "commitmentId", "createdAt", "current", "id", "metric", "order", "target", "updatedAt") SELECT "baseline", "commitmentId", "createdAt", "current", "id", "metric", "order", "target", "updatedAt" FROM "SupportingSignal";
DROP TABLE "SupportingSignal";
ALTER TABLE "new_SupportingSignal" RENAME TO "SupportingSignal";
CREATE TABLE "new_TeamCommitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "strategicIntent" TEXT NOT NULL,
    "primaryMetric" TEXT NOT NULL,
    "primaryBaseline" REAL,
    "primaryTarget" REAL NOT NULL,
    "primaryCurrent" REAL NOT NULL,
    "cycleLabel" TEXT,
    "cycleStartDate" DATETIME NOT NULL,
    "cycleEndDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamCommitment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeamCommitment" ("createdAt", "cycleEndDate", "cycleLabel", "cycleStartDate", "id", "primaryBaseline", "primaryCurrent", "primaryMetric", "primaryTarget", "status", "strategicIntent", "teamId", "updatedAt") SELECT "createdAt", "cycleEndDate", "cycleLabel", "cycleStartDate", "id", "primaryBaseline", "primaryCurrent", "primaryMetric", "primaryTarget", "status", "strategicIntent", "teamId", "updatedAt" FROM "TeamCommitment";
DROP TABLE "TeamCommitment";
ALTER TABLE "new_TeamCommitment" RENAME TO "TeamCommitment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

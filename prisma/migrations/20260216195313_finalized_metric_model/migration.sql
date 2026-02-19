-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "dedicationPct" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dedicationPct" INTEGER,
    "invitedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamCommitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "strategicIntent" TEXT NOT NULL,
    "primaryMetric" TEXT NOT NULL,
    "primaryBaseline" REAL,
    "primaryTarget" REAL,
    "primaryCurrent" REAL,
    "cycleLabel" TEXT,
    "cycleStartDate" DATETIME NOT NULL,
    "cycleEndDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamCommitment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportingSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commitmentId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "baseline" REAL,
    "target" REAL,
    "current" REAL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupportingSignal_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "TeamCommitment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Initiative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commitmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Initiative_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "TeamCommitment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GripSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commitmentId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "confidence" TEXT NOT NULL,
    "primaryOutcomeSnapshot" REAL NOT NULL,
    "issues" TEXT NOT NULL,
    "planForward" TEXT NOT NULL,
    "supportingSignalSnapshots" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GripSession_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "TeamCommitment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_teamId_email_key" ON "TeamInvitation"("teamId", "email");

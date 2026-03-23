-- MIGRATION: add_multiple_objectives
-- Team OKR model refactor (Paulo Caroli Team OKR).
--
-- Scope: In this product, Team OKRs live on a TeamCommitment (cycle), not directly on Team.
--        objectives.commitment_id references the active or historical commitment.
--
-- This file mirrors prisma/migrations/20260226100000_team_okr_objectives/migration.sql
-- for Supabase-hosted Postgres. Id columns are TEXT (Prisma cuid-compatible).

-- ─── Staging maps (dropped at end) ─────────────────────────────────────────

CREATE TABLE "_MigratePrimaryKR" (
    "commitmentId" TEXT NOT NULL,
    "keyResultId" TEXT NOT NULL,
    CONSTRAINT "_MigratePrimaryKR_pkey" PRIMARY KEY ("commitmentId")
);

CREATE TABLE "_MigrateKRMap" (
    "legacySignalId" TEXT NOT NULL,
    "keyResultId" TEXT NOT NULL,
    CONSTRAINT "_MigrateKRMap_pkey" PRIMARY KEY ("legacySignalId")
);

-- ─── New tables ─────────────────────────────────────────────────────────────

CREATE TABLE "Objective" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KeyResult" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "baseline" DOUBLE PRECISION,
    "target" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Objective_commitmentId_idx" ON "Objective"("commitmentId");
CREATE INDEX "KeyResult_objectiveId_idx" ON "KeyResult"("objectiveId");

ALTER TABLE "Objective" ADD CONSTRAINT "Objective_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "TeamCommitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KeyResult" ADD CONSTRAINT "KeyResult_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── One Objective + primary KeyResult per commitment ───────────────────────

DO $$
DECLARE
  c RECORD;
  obj_id TEXT;
  pk_kr TEXT;
BEGIN
  FOR c IN SELECT * FROM "TeamCommitment" LOOP
    obj_id := replace(gen_random_uuid()::text, '-', '');
    INSERT INTO "Objective" ("id", "commitmentId", "title", "description", "sortOrder", "createdAt", "updatedAt")
    VALUES (
      obj_id,
      c.id,
      COALESCE(NULLIF(trim(c."primaryOutcomeStatement"), ''), c."primaryMetric"),
      NULL,
      0,
      NOW(),
      NOW()
    );
    pk_kr := replace(gen_random_uuid()::text, '-', '');
    INSERT INTO "KeyResult" ("id", "objectiveId", "title", "metric", "baseline", "target", "current", "sortOrder", "createdAt", "updatedAt")
    VALUES (
      pk_kr,
      obj_id,
      c."primaryMetric",
      c."primaryMetric",
      c."primaryBaseline",
      c."primaryTarget",
      c."primaryCurrent",
      0,
      NOW(),
      NOW()
    );
    INSERT INTO "_MigratePrimaryKR" ("commitmentId", "keyResultId") VALUES (c.id, pk_kr);
  END LOOP;
END $$;

-- ─── SupportingSignal → KeyResult ───────────────────────────────────────────

DO $$
DECLARE
  s RECORD;
  obj_id TEXT;
  new_kr TEXT;
BEGIN
  FOR s IN SELECT * FROM "SupportingSignal" ORDER BY "commitmentId" ASC, "order" ASC LOOP
    SELECT o.id INTO obj_id FROM "Objective" o WHERE o."commitmentId" = s."commitmentId" ORDER BY o."sortOrder" ASC LIMIT 1;
    new_kr := replace(gen_random_uuid()::text, '-', '');
    INSERT INTO "KeyResult" ("id", "objectiveId", "title", "metric", "baseline", "target", "current", "sortOrder", "createdAt", "updatedAt")
    VALUES (
      new_kr,
      obj_id,
      COALESCE(NULLIF(trim(s.statement), ''), s.metric),
      s.metric,
      s.baseline,
      s.target,
      s.current,
      s."order" + 1,
      NOW(),
      NOW()
    );
    INSERT INTO "_MigrateKRMap" ("legacySignalId", "keyResultId") VALUES (s.id, new_kr);
  END LOOP;
END $$;

-- ─── GripSession ─────────────────────────────────────────────────────────────

ALTER TABLE "GripSession" ADD COLUMN "keyResultSnapshots" JSONB;

DO $$
DECLARE
  gs RECORD;
  snap JSONB;
  k TEXT;
  v TEXT;
  new_kr TEXT;
  pk_kr TEXT;
BEGIN
  FOR gs IN SELECT * FROM "GripSession" LOOP
    snap := '{}'::JSONB;
    IF gs."supportingSignalSnapshots" IS NOT NULL THEN
      FOR k, v IN SELECT * FROM jsonb_each_text(gs."supportingSignalSnapshots"::jsonb) LOOP
        SELECT m."keyResultId" INTO new_kr FROM "_MigrateKRMap" m WHERE m."legacySignalId" = k;
        IF new_kr IS NOT NULL THEN
          snap := snap || jsonb_build_object(new_kr, v::double precision);
        END IF;
      END LOOP;
    END IF;
    SELECT p."keyResultId" INTO pk_kr FROM "_MigratePrimaryKR" p WHERE p."commitmentId" = gs."commitmentId";
    IF pk_kr IS NOT NULL THEN
      snap := snap || jsonb_build_object(pk_kr, gs."primaryOutcomeSnapshot");
    END IF;
    UPDATE "GripSession" SET "keyResultSnapshots" = snap WHERE id = gs.id;
  END LOOP;
END $$;

ALTER TABLE "GripSession" ALTER COLUMN "keyResultSnapshots" SET NOT NULL;
ALTER TABLE "GripSession" DROP COLUMN "primaryOutcomeSnapshot",
DROP COLUMN "supportingSignalSnapshots";

-- ─── Initiative expectedImpact ───────────────────────────────────────────────

DO $$
DECLARE
  r RECORD;
  new_arr jsonb := '[]'::jsonb;
  primary_kr text;
  elem text;
  kid text;
  has_primary boolean;
BEGIN
  FOR r IN SELECT * FROM "Initiative" WHERE "expectedImpact" IS NOT NULL LOOP
    new_arr := '[]'::jsonb;
    SELECT p."keyResultId" INTO primary_kr FROM "_MigratePrimaryKR" p WHERE p."commitmentId" = r."commitmentId";
    has_primary := COALESCE((r."expectedImpact"->>'primary')::boolean, false);
    IF has_primary AND primary_kr IS NOT NULL THEN
      new_arr := new_arr || jsonb_build_array(primary_kr);
    END IF;
    IF r."expectedImpact" ? 'signalIds' AND jsonb_typeof(r."expectedImpact"->'signalIds') = 'array' THEN
      FOR elem IN SELECT jsonb_array_elements_text(r."expectedImpact"->'signalIds') LOOP
        SELECT m."keyResultId" INTO kid FROM "_MigrateKRMap" m WHERE m."legacySignalId" = elem;
        IF kid IS NOT NULL THEN
          new_arr := new_arr || jsonb_build_array(kid);
        END IF;
      END LOOP;
    END IF;
    UPDATE "Initiative" SET "expectedImpact" = jsonb_build_object('keyResultIds', new_arr) WHERE id = r.id;
  END LOOP;
END $$;

-- ─── Drop legacy ────────────────────────────────────────────────────────────

DROP TABLE "SupportingSignal";

ALTER TABLE "TeamCommitment" DROP COLUMN "primaryOutcomeStatement",
DROP COLUMN "primaryMetric",
DROP COLUMN "primaryBaseline",
DROP COLUMN "primaryTarget",
DROP COLUMN "primaryCurrent";

DROP TABLE "_MigrateKRMap";
DROP TABLE "_MigratePrimaryKR";

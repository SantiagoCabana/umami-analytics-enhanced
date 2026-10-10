-- CreateTable
CREATE TABLE "short_domain" (
    "short_domain_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hostname" VARCHAR(255) NOT NULL,
    "root_redirect_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "short_domain_pkey" PRIMARY KEY ("short_domain_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "short_domain_hostname_key" ON "short_domain"("hostname");

-- Preserve every assigned hostname from migration 27. A root redirect is intentionally
-- left unset because inventing a destination could cause a self-redirect loop.
INSERT INTO "short_domain" ("hostname")
SELECT DISTINCT "domain"
FROM "link_domain";

-- AddColumn
ALTER TABLE "link_domain" ADD COLUMN "domain_id" UUID;

-- Backfill
UPDATE "link_domain" AS "link_domain"
SET "domain_id" = "short_domain"."short_domain_id"
FROM "short_domain"
WHERE "short_domain"."hostname" = "link_domain"."domain";

-- Make the relational assignment mandatory after all existing rows are mapped.
ALTER TABLE "link_domain" ALTER COLUMN "domain_id" SET NOT NULL;

-- Replace the old string-based key and index.
ALTER TABLE "link_domain" DROP CONSTRAINT "link_domain_pkey";
DROP INDEX IF EXISTS "link_domain_domain_idx";
ALTER TABLE "link_domain" DROP COLUMN "domain";
ALTER TABLE "link_domain" ADD CONSTRAINT "link_domain_pkey" PRIMARY KEY ("link_id", "domain_id");
CREATE INDEX "link_domain_domain_id_idx" ON "link_domain"("domain_id");

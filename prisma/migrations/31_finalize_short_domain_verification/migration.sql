ALTER TABLE "short_domain" DROP COLUMN "verified_at";

ALTER TABLE "short_domain" ALTER COLUMN "root_redirect_url" SET NOT NULL;

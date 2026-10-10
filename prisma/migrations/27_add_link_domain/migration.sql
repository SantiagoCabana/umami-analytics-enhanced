-- CreateTable
CREATE TABLE "link_domain" (
    "link_id" UUID NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_domain_pkey" PRIMARY KEY ("link_id", "domain")
);

-- CreateIndex
CREATE INDEX "link_domain_domain_idx" ON "link_domain"("domain");

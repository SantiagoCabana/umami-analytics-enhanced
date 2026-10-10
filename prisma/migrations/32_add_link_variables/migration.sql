CREATE TABLE "link_variable" (
    "link_variable_id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "value" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "link_variable_pkey" PRIMARY KEY ("link_variable_id")
);

CREATE UNIQUE INDEX "link_variable_name_key" ON "link_variable"("name");

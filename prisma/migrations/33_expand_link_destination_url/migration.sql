-- Historical tracked links can legitimately include long signed or campaign
-- destinations. Keep them intact when migrating legacy Umami installations.
ALTER TABLE "link" ALTER COLUMN "url" TYPE VARCHAR(2000);

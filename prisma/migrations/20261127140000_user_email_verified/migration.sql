ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMPTZ(6);

UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;

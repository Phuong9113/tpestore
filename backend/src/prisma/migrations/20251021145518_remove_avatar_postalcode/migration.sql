-- AlterTable: remove avatar and postalCode from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "postalCode";
ALTER TABLE "User" DROP COLUMN IF EXISTS "avatar";

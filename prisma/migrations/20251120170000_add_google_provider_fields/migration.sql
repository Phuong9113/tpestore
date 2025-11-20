-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('CREDENTIALS', 'GOOGLE');

-- AlterTable
ALTER TABLE "User"
    ADD COLUMN     "provider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIALS',
    ADD COLUMN     "providerId" TEXT,
    ALTER COLUMN   "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_providerId_key" ON "User"("providerId");

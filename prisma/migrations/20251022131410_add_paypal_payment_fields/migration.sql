/*
  Warnings:

  - You are about to drop the column `ghnOrderCode` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `ghnTrackingCode` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paypalTransactionId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingAddress` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingDistrict` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingFee` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingPhone` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingStatus` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingWard` on the `Order` table. All the data in the column will be lost.
  - The `paymentMethod` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "ghnOrderCode",
DROP COLUMN "ghnTrackingCode",
DROP COLUMN "paypalTransactionId",
DROP COLUMN "shippingAddress",
DROP COLUMN "shippingCity",
DROP COLUMN "shippingDistrict",
DROP COLUMN "shippingFee",
DROP COLUMN "shippingPhone",
DROP COLUMN "shippingStatus",
DROP COLUMN "shippingWard",
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "transactionId" TEXT,
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" TEXT;

-- DropEnum
DROP TYPE "public"."PaymentMethod";

-- DropEnum
DROP TYPE "public"."ShippingStatus";

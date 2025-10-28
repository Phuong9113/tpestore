-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'ZALOPAY');

-- Update existing PAYPAL values to COD before changing column type
UPDATE "Order" SET "paymentMethod" = 'COD' WHERE "paymentMethod" = 'PAYPAL';

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" USING "paymentMethod"::text::"PaymentMethod";

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'PAYPAL', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "ghnOrderCode" TEXT,
ADD COLUMN     "ghnTrackingCode" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
ADD COLUMN     "paypalOrderId" TEXT,
ADD COLUMN     "paypalTransactionId" TEXT,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingDistrict" TEXT,
ADD COLUMN     "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "shippingPhone" TEXT,
ADD COLUMN     "shippingStatus" "ShippingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "shippingWard" TEXT;

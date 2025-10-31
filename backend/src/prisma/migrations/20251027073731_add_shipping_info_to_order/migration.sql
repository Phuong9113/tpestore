-- Add shipping info columns to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingProvince" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingDistrict" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingWard" TEXT;

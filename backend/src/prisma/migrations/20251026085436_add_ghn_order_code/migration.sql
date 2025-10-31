-- Add GHN order code to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "ghnOrderCode" TEXT;

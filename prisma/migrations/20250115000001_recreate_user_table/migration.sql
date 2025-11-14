-- Delete all data from tables that reference User (due to CASCADE, this will happen automatically, but we do it explicitly for clarity)
DELETE FROM "CartItem";
DELETE FROM "OrderItem";
DELETE FROM "Order";
DELETE FROM "Review";
DELETE FROM "ProductInteraction";
DELETE FROM "Address";

-- Drop all foreign key constraints that reference User table
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_userId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_userId_fkey";
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_userId_fkey";
ALTER TABLE "ProductInteraction" DROP CONSTRAINT IF EXISTS "ProductInteraction_userId_fkey";
ALTER TABLE "Address" DROP CONSTRAINT IF EXISTS "Address_userId_fkey";

-- Drop User table
DROP TABLE IF EXISTS "User" CASCADE;

-- Recreate User table with clean schema
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Recreate unique index for email
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Recreate foreign key constraints
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductInteraction" ADD CONSTRAINT "ProductInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


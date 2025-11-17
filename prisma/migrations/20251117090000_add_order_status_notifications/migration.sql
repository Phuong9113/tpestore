-- CreateTable
CREATE TABLE "OrderStatusNotification" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "email" TEXT,
    "subject" TEXT,
    "triggeredBy" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderStatusNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderStatusNotification_orderId_status_key" ON "OrderStatusNotification"("orderId", "status");

-- AddForeignKey
ALTER TABLE "OrderStatusNotification"
ADD CONSTRAINT "OrderStatusNotification_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


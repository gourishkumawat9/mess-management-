-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "refundId" TEXT,
ADD COLUMN     "refundStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_razorpayOrderId_key" ON "Order"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_razorpayPaymentId_key" ON "Order"("razorpayPaymentId");


-- Inventory management was removed, so the mess-only role goes away and the
-- combined canteen + mess role becomes plain canteen staff.
UPDATE "User" SET "role" = 'CANTEEN' WHERE "role" = 'STAFF';
UPDATE "User" SET "role" = 'USER' WHERE "role" = 'MESS';

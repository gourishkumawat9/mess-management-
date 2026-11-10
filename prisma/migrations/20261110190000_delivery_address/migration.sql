-- Hostel and room for delivery: remembered on the user, copied onto each order.
ALTER TABLE "User" ADD COLUMN "hostel" TEXT;
ALTER TABLE "User" ADD COLUMN "room" TEXT;

ALTER TABLE "Order" ADD COLUMN "fulfilment" TEXT NOT NULL DEFAULT 'PICKUP';
ALTER TABLE "Order" ADD COLUMN "deliveryHostel" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryRoom" TEXT;

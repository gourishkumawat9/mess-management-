-- Inventory management is gone, so the mess-only role goes away and the
-- combined canteen + mess role becomes plain canteen staff. (Repeats the
-- earlier role fold for the two seeded accounts the assignment demo put back.)
UPDATE "User" SET "role" = 'CANTEEN' WHERE "role" = 'STAFF';
UPDATE "User" SET "role" = 'USER' WHERE "role" = 'MESS';

-- A preview build of the (unmerged) "production readiness" branch ran its
-- migration against this database and folded the seeded mess-team and
-- combined-staff logins into other roles. Put those two seeded demo accounts
-- back on the roles the assignment version of the app uses. Only these two
-- emails are touched, and on a fresh database this changes nothing.
UPDATE "User" SET "role" = 'STAFF' WHERE "email" = 'staff@iimsambalpur.ac.in';
UPDATE "User" SET "role" = 'MESS' WHERE "email" = 'mess@iimsambalpur.ac.in';

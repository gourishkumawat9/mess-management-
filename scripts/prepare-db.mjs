// Runs in the Vercel build (`npm run vercel-build`): applies database
// migrations and loads the starting data into a new database.
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.warn(
    "\n⚠ DATABASE_URL is not set, so the database was not set up.\n" +
      "  In Vercel: Storage → Create Database → Neon, connect it to this project, then redeploy.\n",
  );
  process.exit(0);
}

// Migrations need a direct (unpooled) connection; fall back to DATABASE_URL.
const env = { ...process.env, DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL };
const run = (cmd) => execSync(cmd, { stdio: "inherit", env });

run("npx prisma migrate deploy");
run("npx tsx prisma/seed.ts");

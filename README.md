# IIMS Canteen · Mess & Canteen app for IIM Sambalpur

One web app with two jobs:

1. **Canteen ordering (Zomato-style).** Anyone at IIM Sambalpur signs up, browses the canteen menu, adds dishes to a cart and places an order. They get a token number and a live tracking page (placed → being prepared → ready for pickup → picked up). Payment is at the counter (cash or UPI).
2. **Mess inventory.** Mess staff track stock of vegetables, milk, curd, ice cream, grains, gas and everything else. The app works out how fast each item is used, how many days it will last, when it needs restocking and how much to order.

The mess itself is a buffet, so it has no ordering in the app; only the canteen does.

The canteen menu is a **placeholder** until the real one is ready. Edit it from the staff **Canteen menu** screen (add, rename, reprice, mark sold out), or change `MENU` in `prisma/seed.ts` and reseed.

## Who can do what

| Role | How you get it | Can do |
| --- | --- | --- |
| **Member** (students, faculty, staff) | Sign up at `/register` | Order from the canteen, track and cancel their own orders |
| **Mess staff** | An admin promotes them | Everything above, plus the staff area: live order board, canteen menu, inventory |
| **Admin** | Seeded, or promoted by another admin | Everything above, plus **Users & roles** |

## Run it locally

You need **Node.js 20 or newer** and a **PostgreSQL** database. The quickest is Docker (`docker compose up -d` starts one that matches `.env.example`), or paste a free [Neon](https://neon.tech) connection string into `.env`.

```bash
npm install
docker compose up -d        # local PostgreSQL (skip if you use Neon or your own)
cp .env.example .env        # then set AUTH_SECRET to a long random string (see the file)
npm run setup               # creates the tables and loads demo data
npm run dev                 # http://localhost:3000
```

Demo logins (passwords come from `SEED_*_PASSWORD` in `.env`; these are the defaults):

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@iimsambalpur.ac.in | Admin@123 |
| Mess staff | staff@iimsambalpur.ac.in | Staff@123 |
| Member | student@iimsambalpur.ac.in | Student@123 |

Change these passwords (or don't seed demo accounts) before real use.

`ALLOWED_EMAIL_DOMAINS` in `.env` limits sign-ups to institute emails, e.g. `iimsambalpur.ac.in`. Leave it empty to allow any email while testing.

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build && npm start` | Production build and server |
| `npm test` | Unit tests (stock maths, order rules, formatting) |
| `npm run typecheck` | TypeScript check |
| `npm run db:seed` | Load demo data into an empty database |
| `npm run db:reset` | Wipe the database and reload demo data |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Screens

**Members:** `/` canteen menu (search, veg-only, bestsellers, category jump) · `/checkout` cart, note for the kitchen, cash/UPI · `/orders` order history · `/orders/[id]` live tracking with the token number.

**Staff** (`/staff`):

- **Dashboard:** items to restock, today's canteen orders and sales, top sellers, recent stock changes, canteen open/closed switch.
- **Live orders:** New / Preparing / Ready columns that refresh every 5 seconds, one-tap status changes, mark paid, cancel with a reason, optional sound alert for new orders.
- **Canteen menu:** add dishes and sections, edit prices, mark sold out, mark bestsellers.
- **Inventory:** every item with stock level, daily use, days left, restock-by date and status; filters for out of stock / low / restock soon / check freshness. "Update" records used, restocked, wasted, or an exact count. Each item has a page with its full stock history.
- **Daily stock count:** at day end, type what's actually left; drops are saved as the day's usage.
- **Restock list:** a printable shopping list with suggested quantities and estimated cost. Tick what arrived to record the delivery.
- **Users & roles** (admin only): promote mess staff, deactivate accounts.

## How the stock numbers work

Every change to an item's quantity is stored as a row in a stock ledger (restocked, used, wasted, count corrected), so nothing is overwritten and you can see who changed what.

For each item you set:

- **Alert when below** (reorder level): at or below this it shows as **Low stock**.
- **Full stock target**: restock suggestions top up to this.
- **Shelf life** (optional, for milk, curd, paneer, bread…): the item is flagged **Check freshness** within 12 hours of its use-by time, counted from the last delivery.

From the last 14 days of usage and wastage the app calculates **uses per day**, **days left**, and **restock by** (the date it will hit the alert level). Items that will hit it by tomorrow show as **Restock soon**. The rules are in `src/lib/inventory.ts` and are unit tested.

## Project structure

```
prisma/
  schema.prisma        database tables
  migrations/          SQL migrations
  seed.ts              demo accounts, placeholder menu, sample inventory and orders
src/
  app/                 pages (Next.js App Router) and the JSON API under app/api
  components/          UI: canteen/, staff/, auth/
  server/              business logic that talks to the database
  lib/                 shared rules (stock maths, order flow), auth, validation, formatting
  middleware.ts        sends signed-out visitors to the login page
tests/                 unit tests (Vitest)
```

Built with Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma and PostgreSQL. Logins use a signed, httpOnly session cookie; passwords are hashed with bcrypt.

## Putting it online

### Vercel + Neon (free, about 5 minutes)

1. Open [vercel.com/new](https://vercel.com/new), sign in with GitHub and import this repository.
2. Before clicking **Deploy**, open **Environment Variables** and add:
   - `AUTH_SECRET`: a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`).
   - `SEED_ADMIN_PASSWORD`: the admin's password, 8+ characters. The admin logs in as `admin@iimsambalpur.ac.in` unless you also set `SEED_ADMIN_EMAIL`.
   - Optional: `ALLOWED_EMAIL_DOMAINS=iimsambalpur.ac.in` to allow only institute emails, and `SEED_DEMO_DATA=false` to start without demo orders and stock history.
3. Click **Deploy**. The first build finishes without a database; that's expected.
4. In the project, open **Storage → Create Database → Neon** (free plan) and connect it to the project. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
5. **Deployments → ⋯ → Redeploy.** Each build runs `vercel-build`, which applies database migrations and, only when the database is empty, loads the menu, inventory items and the admin account.

On a live site the demo passwords in `.env.example` are never used: the admin gets `SEED_ADMIN_PASSWORD`, and demo staff/student accounts (if `SEED_DEMO_DATA` is on) get random passwords nobody knows. Sign in as admin, then promote real mess staff from **Users & roles**.

### Your own server or VM

`npm ci && npm run build && npm run setup && npm start` behind Nginx with HTTPS, with `DATABASE_URL` pointing at PostgreSQL.

### Notes

- Always set a strong `AUTH_SECRET` and serve over HTTPS in production.
- Rate limiting is in memory, per server instance. Use a shared store (e.g. Redis) if you need strict limits across many instances.

## Not built yet

- Online payment (orders are paid at the counter).
- Linking canteen sales to inventory (e.g. each Maggi order reducing Maggi packets).
- Push or SMS notifications when an order is ready (the tracking page updates itself).
- Dish photos (emoji placeholders for now; each dish accepts a photo URL).

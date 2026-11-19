# IIMS Canteen · Canteen ordering for IIM Sambalpur

Anyone at IIM Sambalpur signs up, browses the canteen menu, adds dishes to a cart and places an order for pickup or delivery to their hostel room. They pay online (UPI, card or wallet through Razorpay) or at the counter, get a token number and a live tracking page (placed → being prepared → ready → picked up).

**For the people running the canteen: see [docs/GUIDE.md](docs/GUIDE.md)** for how everything works and how to change the menu, hours, staff, payments and branding.

The canteen menu is a **placeholder** until the real one is ready. Edit it from the staff **Canteen menu** screen (add, rename, reprice, mark sold out), or change `MENU` in `prisma/seed.ts` and reseed.

## Who can do what

| Role | How you get it | Can do |
| --- | --- | --- |
| **Member** (students, faculty, staff) | Sign up at `/register` | Order from the canteen for pickup or delivery to their hostel room, track and cancel their own orders |
| **Canteen staff** | An admin sets the role | Canteen dashboard: live order board (with delivery addresses), canteen menu, open/close the canteen |
| **Owner / Admin** | Seeded, or promoted by another admin | Everything, on one combined dashboard, plus **Users & roles** |

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
| Canteen staff | canteen@iimsambalpur.ac.in | Staff@123 |
| Member | student@iimsambalpur.ac.in | Student@123 |

Change these passwords (or don't seed demo accounts) before real use.

`ALLOWED_EMAIL_DOMAINS` in `.env` limits sign-ups to institute emails, e.g. `iimsambalpur.ac.in`. Leave it empty to allow any email while testing.

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build && npm start` | Production build and server |
| `npm test` | Unit tests (order rules, payment checks, formatting) |
| `npm run typecheck` | TypeScript check |
| `npm run db:seed` | Load demo data into an empty database |
| `npm run db:reset` | Wipe the database and reload demo data |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Screens

**Members:** `/` canteen menu (search, veg-only, bestsellers, category jump) · `/checkout` cart, delivery to hostel & room or pickup, note for the kitchen, pay online or at the counter · `/orders` order history · `/orders/[id]` live tracking with the token number.

**Staff** (`/staff`):

- **Dashboard:** today's canteen orders and sales, top sellers, canteen open/closed switch and ordering hours.
- **Live orders:** New / Preparing / Ready columns that refresh every 5 seconds, one-tap status changes, mark counter payments paid, cancel with a reason (online payments are refunded automatically), optional sound alert for new orders.
- **Canteen menu:** add dishes and sections, edit prices, mark sold out, mark bestsellers.
- **Users & roles** (admin only): promote canteen staff, deactivate accounts.

## Payments

Online payment uses Razorpay. The server creates the Razorpay order for the total it computed, and only marks an order paid after fetching the payment from Razorpay and checking the order, amount and capture status (from the webhook or right after checkout). Unpaid online orders never reach the kitchen and are cancelled after 15 minutes. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` to turn it on, and `PAY_AT_COUNTER=false` to make it online only. Step-by-step setup is in [docs/GUIDE.md](docs/GUIDE.md#4-payments).

## Project structure

```
prisma/
  schema.prisma        database tables
  migrations/          SQL migrations
  seed.ts              admin account, starting menu, demo accounts and orders
src/
  app/                 pages (Next.js App Router) and the JSON API under app/api
  components/          UI: canteen/, staff/, auth/
  server/              business logic: orders, payments (Razorpay), dashboard
  lib/                 shared rules (order flow, hours), auth, validation, formatting
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
   - Optional: `ALLOWED_EMAIL_DOMAINS=iimsambalpur.ac.in` to allow only institute emails, and `SEED_DEMO_DATA=false` to start without demo orders.
   - For online payment: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (see docs/GUIDE.md).
3. Click **Deploy**. The first build finishes without a database; that's expected.
4. In the project, open **Storage → Create Database → Neon** (free plan) and connect it to the project. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
5. **Deployments → ⋯ → Redeploy.** Each build runs `vercel-build`, which applies database migrations and, only when the database is empty, loads the menu and the admin account.

On a live site the demo passwords in `.env.example` are never used: the admin gets `SEED_ADMIN_PASSWORD`, and demo staff/student accounts (if `SEED_DEMO_DATA` is on) get random passwords nobody knows. Sign in as admin, then promote real canteen staff from **Users & roles**.

### Your own server or VM

`npm ci && npm run build && npm run setup && npm start` behind Nginx with HTTPS, with `DATABASE_URL` pointing at PostgreSQL.

### Notes

- Always set a strong `AUTH_SECRET` and serve over HTTPS in production.
- Rate limiting is in memory, per server instance. Use a shared store (e.g. Redis) if you need strict limits across many instances.

## Not built yet

- Push or SMS notifications when an order is ready (the tracking page updates itself).
- Dish photos (emoji placeholders for now; each dish accepts a photo URL).

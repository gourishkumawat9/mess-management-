# IIMS Canteen: how it works and how to change it

This guide is for whoever runs the site for the canteen. It explains what each part of the app does, where it lives, and how to change the things a vendor usually asks for. You do not need to be a programmer for most of it; where a code change is needed, the exact file is named.

---

## 1. The big picture

The whole site is **one Next.js app** (a website and its server in the same project), hosted on **Vercel**, with a **PostgreSQL database on Neon**. Payments go through **Razorpay**.

```
 Student's phone ──► Website pages (src/app, src/components)
                        │
                        ▼
                    API routes (src/app/api)  ──► Razorpay (online payment)
                        │                          ▲
                        ▼                          │ webhook: "payment done"
                    Business rules (src/server, src/lib)
                        │
                        ▼
                    Database (Neon PostgreSQL; tables in prisma/schema.prisma)
```

- **Frontend** = what people see: the menu, cart, checkout, order tracking, and the staff dashboard.
- **Backend** = the API routes and business rules. They decide prices, totals, who may do what, and whether an order is paid. **The browser is never trusted for any of these.**
- **Database** = users, menu, orders, settings.

### Who can do what

| Role | How someone gets it | What they can do |
| --- | --- | --- |
| Student / Member (`USER`) | Signs up at `/register` | Browse, order, pay, track and cancel their own orders |
| Canteen staff (`CANTEEN`) | Admin sets it in **Users & roles** | Live orders board, mark counter payments, cancel orders, edit the menu, open/close the canteen, change ordering hours |
| Owner / Admin (`ADMIN`) | Created on first deploy, or promoted by another admin | Everything staff can do, plus **Users & roles** |

The inventory/stock pages were removed. Old "Mess staff" accounts became members and "Canteen + mess staff" accounts became canteen staff.

---

## 2. Where things live

| What | Where |
| --- | --- |
| Pages (one folder per URL) | `src/app/` (e.g. `src/app/checkout/page.tsx` is `/checkout`) |
| Visual pieces used by pages | `src/components/` (`canteen/` for students, `staff/` for the dashboard, `auth/` for login/sign-up) |
| API (what the pages call) | `src/app/api/` |
| Business rules: orders, payments, menu | `src/server/canteen.ts`, `src/server/payments.ts` |
| Shared rules and settings in code | `src/lib/constants.ts` (roles, limits, payment options), `src/lib/orders.ts` (order status flow), `src/lib/hours.ts` (opening hours), `src/lib/validation.ts` (what input is allowed) |
| Login / sessions | `src/lib/auth.ts`, `src/lib/session.ts`, `src/middleware.ts` |
| Database tables | `prisma/schema.prisma`; changes go in `prisma/migrations/` |
| Starting data (first admin, starting menu) | `prisma/seed.ts` |
| Colours | `tailwind.config.ts` |
| Photos | `src/lib/photos.ts` and `public/images/` |
| Secret keys and switches | Vercel → Project **iims-canteen** → Settings → **Environment Variables** (locally: `.env`, never committed) |

---

## 3. Everyday changes (no code)

These are done by logging in as admin or canteen staff and opening **/staff**.

### Menu items and prices
**Staff → Canteen menu** (`/staff/menu`). Add a dish, change its name or price, mark it **Sold out**, mark a **Bestseller**, or add a new section. Prices are whole rupees.

- A price change applies to new orders immediately. Old orders keep the price they were placed at.
- A sold-out or removed dish is rejected by the server even if a student still has it in their cart.

### Open or close the canteen
The switch on the **Dashboard** and on **Live orders**. Switching off stops new orders immediately.

### Ordering hours
Under the switch: **Ordering hours: … · change**. Type the hours in India time, like `9:00 PM – 4:00 AM` (hours past midnight are fine). For all day, use `12:00 AM – 12:00 AM`. Orders are only accepted when the switch is on **and** the time is inside these hours. The server rejects text it can't read, so a typo can't accidentally leave the canteen open.

The starting value is `9:00 PM – 4:00 AM` (set in `prisma/seed.ts` and `DEFAULT_CANTEEN_HOURS` in `src/lib/constants.ts`). **Confirm the real hours with the vendor and set them here.**

### Staff accounts and roles
1. The person signs up normally at `/register`.
2. Admin opens **Users & roles** (`/staff/users`), finds them, and sets the role to **Canteen staff** (or **Admin**).
3. To remove access, set **Inactive** or change the role back to **Student / Member**. It takes effect on their next click; no need to wait for them to log out.

An admin cannot remove their own admin access (so the site can never be left without one).

### Running orders
**Live orders** (`/staff/orders`) shows New → Preparing → Ready columns and refreshes every 5 seconds. Tap to move an order forward, **Mark paid** for cash/UPI-at-counter orders, or ✕ to cancel with a reason the student sees. Online orders show **Paid online ✓** and cannot be marked unpaid. Cancelling an online order refunds the student automatically.

---

## 4. Payments

### How it works
- **Pay now (online)**: the student pays by UPI, card or wallet in a Razorpay window.
  1. The server works out the total from the database and creates a Razorpay order for exactly that amount.
  2. The order waits as **Waiting for payment**. The kitchen does not see it and it has no token yet.
  3. When Razorpay confirms the payment (through the webhook, or right after checkout), the server **fetches the payment from Razorpay itself** and checks that it belongs to this order, is in rupees, is for the exact amount, and is captured. Only then is the order marked paid, given a token and sent to the kitchen.
  4. If nobody pays within 15 minutes the order is cancelled. If money arrives for a cancelled order anyway, it is refunded automatically.
- **Pay at counter**: cash or the canteen's own UPI QR, on pickup or delivery. Staff tap **Mark paid**.

Nothing the browser sends can change a price, a total, or mark an order paid.

### Setting up Razorpay (needed before "Pay now" appears)
1. The vendor (or whoever receives the money) creates a Razorpay account at dashboard.razorpay.com and completes KYC. The money settles into **their** bank account, so it must be their account, not yours.
2. **Test first:** in Test mode, Account & Settings → API Keys → Generate key. You get a **Key Id** (`rzp_test_…`) and **Key Secret**.
3. Account & Settings → Webhooks → **Add new webhook**:
   - URL: `https://<your site>/api/payments/razorpay/webhook`
   - Secret: make up a long random string
   - Events: `payment.authorized`, `payment.captured`, `order.paid`, `refund.processed`, `refund.failed`
4. In Vercel → iims-canteen → Settings → Environment Variables, add (Production):
   | Name | Value |
   | --- | --- |
   | `RAZORPAY_KEY_ID` | the Key Id |
   | `RAZORPAY_KEY_SECRET` | the Key Secret (mark as Sensitive) |
   | `RAZORPAY_WEBHOOK_SECRET` | the webhook secret from step 3 (Sensitive) |
5. Redeploy (Deployments → ⋯ → Redeploy). Place a test order with Razorpay's test UPI ID `success@razorpay`.
6. When happy, switch Razorpay to **Live mode**, generate live keys and a live webhook, replace the three values, and redeploy.

Never paste the Key Secret into code, chat or a document that leaves your hands.

### Choosing payment methods
| Vendor wants | Do this |
| --- | --- |
| Online and pay at counter (default) | Set the three Razorpay values |
| Online only | Also add `PAY_AT_COUNTER` = `false` |
| Pay at counter only | Leave the Razorpay values empty |

Code: `src/server/payments.ts` (Razorpay calls and checks), `src/server/canteen.ts` (`placeOrder`, `confirmOnlinePayment`), `src/app/api/payments/razorpay/webhook/route.ts`, `src/components/canteen/CheckoutView.tsx` (the payment choice the student sees).

### Refunds
Cancelling a paid online order (by the student before cooking starts, or by staff at any time) refunds the full amount through Razorpay. If an automatic refund fails, the student's order page says so and the server log says "Refund failed". Then refund it by hand in the Razorpay dashboard (Transactions → Payments → the payment → Refund).

---

## 5. Changes that need a small code edit

After any code change: commit, push, and Vercel redeploys on its own.

| Vendor asks for | File | What to change |
| --- | --- | --- |
| Canteen name in the header, footer, browser tab | `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/app/layout.tsx`, `src/app/manifest.ts` | Replace the text `IIMS Canteen` |
| Home page wording ("Late night cravings", ticker text) | `src/components/canteen/MenuBrowser.tsx`, `src/components/Footer.tsx` | Edit the text in the file |
| Colours | `tailwind.config.ts` | `brand` is the main red, `gold` the accent, `cream` the background |
| Logo / app icon | `src/app/icon.svg` | Replace the file |
| Photos | `src/lib/photos.ts`, `public/images/` | Point a photo at a new file |
| Address shown in the footer | `src/components/Footer.tsx` | Edit the address line |
| Name shown on the Razorpay payment window | `src/components/canteen/CheckoutView.tsx` and `src/components/canteen/OrderTracker.tsx` | Replace `"IIM Sambalpur Canteen"` |
| Max of one dish per order (20), max orders in progress per student (3), lines per order (30) | `src/lib/constants.ts` | `MAX_ITEM_QUANTITY`, `MAX_ACTIVE_ORDERS_PER_USER`, `MAX_ORDER_LINES` |
| Time allowed to pay online (15 min) | `src/lib/constants.ts` | `PAYMENT_WINDOW_MINUTES` (keep it above 5) |
| Highest allowed dish price (₹10,000) | `src/lib/validation.ts` | `menuItemSchema` → `price … max(10_000)` |
| Only institute emails can sign up | Vercel env var `ALLOWED_EMAIL_DOMAINS` | e.g. `iimsambalpur.ac.in` (comma-separate several) |
| Pickup only / delivery only | `src/components/canteen/CheckoutView.tsx` | Remove the option you don't want from the "Delivery or pickup" list; also `FULFILMENTS` in `src/lib/constants.ts` |
| Packaging or delivery charge | Needs a small feature in `placeOrder` (`src/server/canteen.ts`) and the bill section of `CheckoutView.tsx` | Ask a developer; the charge must be added on the server, not just shown |

---

## 6. Going live checklist

1. In Vercel env vars:
   - `AUTH_SECRET`: set (it is). Changing it logs everyone out.
   - `DEMO_OPEN_ACCESS`: now `0`. It can be deleted; the demo feature no longer exists in the code.
   - `ALLOWED_EMAIL_DOMAINS`: **not set yet.** Set it to `iimsambalpur.ac.in` so outsiders can't sign up.
   - `SEED_DEMO_DATA`: consider wiping the demo orders and demo accounts before launch (see below).
   - Razorpay values as in section 4.
2. Log in as admin and change the admin password if it was shared.
3. Set the real menu, prices and hours in the staff screens.
4. Promote the counter staff to **Canteen staff**.
5. Place one real ₹1-level test order (make a ₹1 test dish, then delete it) and refund it.

**Demo data on the live database.** The first deploy loaded demo students (Aarav, Priya…), a demo canteen account and fake past orders. Their passwords are random, so nobody can log in as them, but the fake orders count in "sales today" history. To start clean, deactivate the demo accounts in Users & roles, or ask a developer to wipe and re-seed the database with `SEED_DEMO_DATA=false` before launch day.

---

## 7. Running it on a laptop (for developers)

```bash
npm install
docker compose up -d          # local PostgreSQL
cp .env.example .env          # set AUTH_SECRET; Razorpay test keys optional
npm run setup                 # tables + demo data
npm run dev                   # http://localhost:3000
npm test                      # unit tests
```

Every Vercel build runs `scripts/prepare-db.mjs`, which applies new database migrations automatically.

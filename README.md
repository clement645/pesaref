# PesaRef

A production-oriented referral management platform for a KSh 200 one-time
registration/service fee and a one-level, KSh 250 referral commission
program, with manual (non-automated) payment and withdrawal processing.

> Rename freely: this codebase is generic. Change `package.json#name`, the
> `platformName` setting (Admin -> Settings), and the `<title>` in
> `src/app/layout.tsx`.

## 1. Project overview

- Members pay a one-time KSh 200 registration/service fee to activate their
  account.
- Every **ACTIVE** member gets a unique referral code and link
  (`/register?ref=CODE`).
- When a referred person registers and their own KSh 200 payment is
  **manually verified and approved**, the referrer earns a KSh 250
  commission - automatically, exactly once, atomically.
- This is a **one-level** referral system only - no multi-level payouts.
- All registration payments and withdrawals are reviewed and actioned
  manually by an administrator via M-Pesa. There is no automated payment
  gateway wired up yet (see "Payment system" below).
- Every financial action (payment approval/rejection, commission creation,
  withdrawal payout/rejection, wallet adjustment, status change) is wrapped
  in a database transaction and recorded in an immutable audit log.

## 2. Features

- Email/password auth with hashed passwords (bcrypt), HTTP-only JWT session
  cookies, login rate limiting and lockout, password reset flow.
- Role-based access control: `USER`, `ADMIN`, `SUPER_ADMIN`, enforced both in
  middleware (fast path) and again in every server action/page via
  `requireUser`/`requireAdmin`/`requireSuperAdmin` (defense in depth).
- Referral tracking with self-referral prevention, duplicate-commission
  prevention, and automatic commission withholding while a referrer is
  suspended.
- Wallet with a full transaction ledger (`WalletTransaction`) - balances are
  always derived from ledgered, audited operations, never mutated directly.
- Withdrawal flow that **reserves** funds on request (moves
  available -> pending) rather than deducting them permanently, released
  back on rejection or converted to `totalWithdrawn` on payout.
- Admin dashboard with stat cards, time-series charts (registrations,
  approved payments, commissions, withdrawals), and a recent-activity feed.
- Admin tools: user search/detail/status management, payment review queue,
  referral list, withdrawal review queue (mark-as-paid / reject with
  reason), all-transactions view, audit log viewer, and platform settings
  (registration fee, commission amount, minimum withdrawal, payment
  instructions - locked to `SUPER_ADMIN`).
- Pluggable email/SMS notification layer (defaults to a console logger; swap
  in Resend/Africa's Talking later without touching call sites).
- Responsive UI with a real dashboard shell, mobile nav, modals, toasts,
  status badges, loading skeletons, and empty states.

## 3. Architecture

```
src/
  app/                     Next.js App Router routes
    (marketing)/           Public marketing pages (home, about, terms, ...)
    (auth)/                Login, register, forgot/reset password
    payment/                Registration payment submission page
    dashboard/              Authenticated member area
    admin/                  Authenticated ADMIN/SUPER_ADMIN area
  components/
    ui/                     Small, unstyled-opinionated primitives (shadcn-style)
    layout/                 Header, footer, sidebars, nav
    admin/                  Admin-only visual components (charts, ...)
  lib/
    actions/                'use server' Server Actions (the only mutation entrypoints)
    services/               Business logic + Prisma transactions (framework-agnostic)
    validations/            Zod schemas
    auth/                   Password hashing, JWT session, rate limiting
    email/ sms/             Pluggable notification providers
    utils/                  Money, phone, referral code, cn() helpers
  middleware.ts             Edge-level route protection for /dashboard, /admin
prisma/
  schema.prisma             Database schema
  seed.ts                   Development/test seed data
tests/
  unit/                     Pure-function tests (no DB)
  integration/              Service-layer tests against a real Postgres DB
```

Server Actions call into the **service layer** (`src/lib/services/*`), which
is the only place that touches Prisma for business logic. Every
multi-step financial operation runs inside `prisma.$transaction(...)`,
locks the wallet row with `SELECT ... FOR UPDATE` before reading/writing its
balance, and writes an audit log entry - so partial writes and lost updates
under concurrency are not possible.

## 4. Technology stack

Next.js 14 (App Router) + TypeScript (strict) + PostgreSQL + Prisma ORM +
Tailwind CSS + Radix UI primitives (shadcn-style components) + Zod + bcryptjs
+ `jose` (JWT sessions) + Recharts (admin charts) + Vitest.

## 5. Local installation

Prerequisites: Node.js 18.18+, a PostgreSQL database (local Postgres, or a
free Neon/Supabase instance).

```bash
git clone <your-fork-url> pesaref
cd pesaref
npm install
cp .env.example .env
# edit .env: DATABASE_URL, DIRECT_URL, AUTH_SECRET, APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Visit http://localhost:3000. Log in with the SUPER_ADMIN credentials from
`ADMIN_EMAIL` / `ADMIN_PASSWORD`, or one of the seeded sample accounts
printed at the end of the seed script's output (development only).

## 6. Environment variables

See `.env.example` for the full annotated list. Summary:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Runtime Postgres connection (pooled, if available) |
| `DIRECT_URL` | yes | Direct Postgres connection, used only by `prisma migrate` |
| `AUTH_SECRET` | yes | Signs session JWTs and must be a long random string |
| `APP_URL` | yes | Public base URL, used to build referral links |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_FULL_NAME` / `ADMIN_PHONE` | yes (seed only) | Creates the initial SUPER_ADMIN when you run the seed script |
| `EMAIL_PROVIDER` / `SMS_PROVIDER` | no | `console` (default, logs only) until a real provider is wired in |
| `RESEND_API_KEY`, `EMAIL_FROM` | no | Used only once you implement `resend.provider.ts` |
| `AFRICASTALKING_*` | no | Used only once you implement `africastalking.provider.ts` |
| `REGISTRATION_FEE_KES` / `REFERRAL_COMMISSION_KES` / `MIN_WITHDRAWAL_KES` | no | Seed defaults for `SystemSetting`; editable afterwards by a SUPER_ADMIN in `/admin/settings` |

**Never** commit a filled-in `.env`. Set real values as Netlify environment
variables for deployment (Site settings -> Environment variables).

## 7. Prisma commands

```bash
npx prisma generate        # regenerate the Prisma Client (also runs on npm install)
npx prisma migrate dev     # create + apply a migration in development
npx prisma migrate deploy  # apply pending migrations in production/CI
npx prisma studio          # browse the database visually
npm run prisma:seed        # (re)populate development/test seed data
```

## 8. Development commands

```bash
npm run dev         # start the Next.js dev server
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (strict mode)
npm test             # run all tests (unit + integration, see "Testing" below)
```

## 9. Production build

```bash
npm run build   # runs `prisma generate` then `next build`
npm start
```

## 10. Netlify deployment

PesaRef targets the official **Netlify Next.js Runtime** (`@netlify/plugin-nextjs`,
declared in `netlify.toml`), which supports the App Router, Server Actions,
middleware, and API routes used here.

1. **Create a PostgreSQL database.** Any managed Postgres works (Neon,
   Supabase, Railway, RDS). Prefer a provider that gives you both a pooled
   connection string and a direct one (Neon/Supabase do).
2. **Configure `DATABASE_URL` / `DIRECT_URL`** locally in `.env` first, to
   run migrations from your machine (see step 3), then again in Netlify's
   environment variables for the deployed app to use at runtime.
3. **Run the Prisma migration** against the real database before your first
   deploy (and after every schema change):
   ```bash
   npx prisma migrate deploy
   ```
   Netlify does not run this automatically - run it manually (or wire it
   into your own CI step) whenever `prisma/schema.prisma` changes.
4. **Seed the database** (optional, creates the SUPER_ADMIN + sample data):
   ```bash
   npm run prisma:seed
   ```
   For a real launch, skip the sample users and only rely on the
   SUPER_ADMIN created from `ADMIN_EMAIL`/`ADMIN_PASSWORD` - or write a
   trimmed seed script.
5. **Push the project to GitHub.**
6. **Connect the GitHub repository to Netlify** (New site from Git). Netlify
   should auto-detect `netlify.toml` (build command `npm run build`,
   `@netlify/plugin-nextjs` plugin).
7. **Configure environment variables** in Netlify (Site settings ->
   Environment variables): `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`,
   `APP_URL` (your Netlify/custom domain, e.g. `https://pesaref.netlify.app`),
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and any notification provider keys you
   plan to use.
8. **Deploy.** Trigger a deploy from the Netlify dashboard or push to your
   connected branch.
9. **Configure a custom domain** under Site settings -> Domain management,
   then update `APP_URL` to match and redeploy so referral links use the
   right host.
10. **Create the initial SUPER_ADMIN** by running `npm run prisma:seed`
    against the production database from a trusted machine (with
    `DATABASE_URL` pointed at production) - or insert the row manually via
    `prisma studio` if you'd rather not run the full seed script in
    production.
11. **Test registration**: visit `/register`, create an account, confirm it
    lands in `PENDING_PAYMENT`.
12. **Test manual payment approval**: submit a payment on `/payment`, then
    log in as an admin and approve it from `/admin/payments`; confirm the
    user becomes `ACTIVE`.
13. **Test referral commission**: register a second account using the first
    account's referral link, approve its payment, and confirm the referrer's
    wallet balance increased by exactly the configured commission amount
    (see `tests/integration/referral-commission.test.ts` for the same
    assertions, automated).
14. **Test withdrawal**: as the referrer, request a withdrawal from
    `/dashboard/withdrawals` and confirm the available balance drops while
    "pending withdrawal" rises by the same amount.
15. **Test manual withdrawal approval**: from `/admin/withdrawals`, mark the
    withdrawal as paid with an M-Pesa reference (or reject it and confirm
    the funds return to the member's available balance).

## 11. Admin setup

The seed script creates one `SUPER_ADMIN` (from `ADMIN_EMAIL`/`ADMIN_PASSWORD`)
and one sample `ADMIN` account (`staffadmin@example.com`, development only -
change or remove this before production use). `SUPER_ADMIN` is required to
change financial settings (`/admin/settings`) or apply manual wallet
adjustments; a plain `ADMIN` can review payments, withdrawals, and manage
user status.

## 12. Testing

```bash
npm test
```

- `tests/unit/*` - pure-function tests (money formatting, Kenyan phone
  normalization). No database required.
- `tests/integration/*` - exercise the real service layer
  (`src/lib/services/*`) against a real PostgreSQL database using the
  `DATABASE_URL` in your `.env`. These cover the scenarios called out in the
  spec: exactly-once commission creation, no commission on rejected/duplicate
  approval, commission withholding while a referrer is suspended, withdrawal
  reservation instead of permanent deduction, payout/rejection ledger
  entries, insufficient-balance and below-minimum rejections, concurrent
  withdrawal requests, and transaction rollback on invalid balance changes.

Use a disposable database or schema for tests - `resetDatabase()` in
`tests/integration/helpers.ts` truncates the relevant tables before every
test.

## 13. Security notes

- Passwords are hashed with bcrypt (cost factor 12); hashes are never
  returned to the client or logged.
- Sessions are signed JWTs (`jose`, HS256) in `httpOnly`, `sameSite=lax`
  cookies; `secure` is enabled automatically in production.
- Server Actions are Next.js's built-in mutation mechanism and include
  same-origin enforcement out of the box; there are no client-callable JSON
  API routes that skip that protection.
- Every admin/financial server action re-checks the caller's role and
  account status server-side (`requireAdmin`/`requireSuperAdmin`) -
  middleware role checks are a fast path, not the source of truth.
- Login and registration are rate-limited per email/IP using a DB-backed
  counter (`LoginAttempt`), because serverless functions have no shared
  in-memory state between invocations.
- All money is stored and calculated as whole-shilling integers - never
  floating point.
- Wallet mutations always go through `SELECT ... FOR UPDATE` inside a
  Prisma transaction, preventing race conditions between, e.g., a commission
  credit and a withdrawal debit on the same wallet.
- Every sensitive action (payment/withdrawal approval or rejection, status
  change, wallet adjustment, settings change, admin login) writes to
  `AuditLog`, which application code never updates or deletes.
- Generic user-facing error messages ("Something went wrong. Please try
  again.") are shown for unexpected failures; details are logged
  server-side only (see `src/app/error.tsx` and the `catch` blocks in
  `src/lib/actions/*`).

## 14. Troubleshooting

- **`AUTH_SECRET environment variable is missing or too short`** - set
  `AUTH_SECRET` in `.env` (or Netlify env vars) to a long random string
  (`openssl rand -base64 48`).
- **Prisma can't reach the database during `next build` on Netlify** -
  `prisma generate` (run automatically via `postinstall` and again in
  `npm run build`) only needs the schema, not a live connection; if the
  *migration* step fails, double-check `DIRECT_URL` is reachable from
  wherever you run `prisma migrate deploy`.
- **Referral links point to `localhost`** - set `APP_URL` to your real
  deployed URL (Netlify falls back to the request's `Host` header if
  `APP_URL` is unset, but setting it explicitly is more predictable).
- **A user's payment was approved but no commission appeared** - check
  whether they were referred at all (`Referral` row must exist) and whether
  the referrer's status was `ACTIVE` at approval time; commissions are
  intentionally withheld (not lost - see `REFERRAL_COMMISSION_WITHHELD` in
  `audit-logs`) while a referrer is suspended or otherwise not active.
- **Tests fail with a connection error** - integration tests need a real,
  reachable `DATABASE_URL`; point it at a disposable local/test database
  before running `npm test`.

## 15. Legal / compliance

The Terms & Conditions (`/terms`) and Privacy Policy (`/privacy`) pages
ship with plain-language placeholder content that transparently discloses
the registration fee, referral commission terms, and withdrawal conditions,
and explicitly avoids guaranteed-income language. **Both documents are
marked in-app as drafts and must be reviewed by a qualified Kenyan lawyer
before the platform processes real payments.**

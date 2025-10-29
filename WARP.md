# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project summary
- GoodSale is a multi-tenant SaaS (Inventory + POS) built with Next.js 15 (App Router), TypeScript, Tailwind, Drizzle ORM (PostgreSQL), NextAuth (credentials), and optional AI via Genkit (Google Gemini).

Common commands
- Install deps
  - pnpm install
- Dev server (port 9002)
  - pnpm dev
- Build and start
  - pnpm build
  - pnpm start
- Lint and typecheck
  - pnpm lint
  - pnpm typecheck
- Tests (Jest + Testing Library)
  - Run all: pnpm test
  - Watch: pnpm test:watch
  - Coverage: pnpm test:coverage
  - Single file: pnpm test -- src/__tests__/lib/trial-validation.test.ts
  - Single test by name: pnpm test -- -t "trial expires"
- Database (Drizzle)
  - Push schema (dev): pnpm db:push
  - Generate migrations: pnpm db:generate
  - Apply migrations: pnpm db:migrate
  - Studio (GUI): pnpm db:studio
  - Drop (DANGEROUS): pnpm db:drop
- Seed data
  - Super admin (interactive): pnpm db:seed:admin
  - Test data: pnpm db:seed:test
- AI (Genkit)
  - Dev server: pnpm genkit:dev
  - Watch mode: pnpm genkit:watch

Environment
- Copy .env.example to .env or .env.local and set at least: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_GENAI_API_KEY.
- Drizzle config reads DATABASE_URL from .env; CLI outputs to drizzle/.

High-level architecture
- Framework and routing (Next.js App Router)
  - Root layout: src/app/layout.tsx sets fonts, Providers, and global Toaster.
  - Admin area: src/app/(admin)/admin/* (dashboard, tenants, plans, profile, settings) wrapped by AdminLayout; protected by middleware.
  - Tenant area: src/app/(goodsale)/[tenant]/* wrapped by TenantLayout with sidebar/header, UserProvider, ShiftProvider.
  - Auth pages: src/app/(auth)/* and src/app/admin/login.
- Auth and security (NextAuth, middleware)
  - src/lib/auth.ts uses CredentialsProvider, bcryptjs, and Drizzle.
  - JWT session includes isSuperAdmin and tenantId; session callback refreshes user avatar.
  - middleware.ts guards /admin/* routes, redirecting non-super-admins to /admin/login and preventing logged-in admins from revisiting login.
- Data layer (Drizzle + pg)
  - Connection: src/db/index.ts (Pool + drizzle(schema)).
  - Schema: src/db/schema.ts defines core tables; multi-tenancy enforced via tenantId FKs on domain tables.
    - Key entities: super_admins, tenants, users, products, sales (+ sale_items), customers, suppliers, categories, shifts (+ shift_reports), plans, plan_pricing, subscriptions, billing_ledger, settings, notifications, tenant_name_change_requests, audit_logs.
- API surface (route handlers under src/app/api)
  - Auth: /api/auth/[...nextauth]
  - Admin management: /api/admin/* (tenants, users, plans, billing, profile, settings, tenant-name-changes)
  - Tenant CRUD: /api/{products,categories,customers,suppliers,sales,purchase-orders,settings,users}
  - Billing/Invoices: /api/invoices/download
  - Notifications: /api/notifications
  - Uploads: /api/upload
  - Cron triggers: /api/cron/{trial-expiration,trial-notifications,subscription-renewal,tenant-name-changes}
- Background jobs (library-driven, invoked via cron routes)
  - src/lib/trial-notifications.ts: sendTrialNotifications() for T-7/T-3/T-1 reminders.
  - src/lib/trial-expiration.ts: handleTrialExpirations() to expire/archive trials.
  - src/lib/subscription-renewal-jobs.ts: renewal reminders and suspendExpiredSubscriptions().
  - src/lib/tenant-name-change-jobs.ts: auto-approve and apply scheduled tenant name changes.
- UI and styling
  - Tailwind (tailwind.config.ts) + shadcn/ui (Radix) with custom fonts and CSS variables.
  - Key layouts: AdminSidebar/AdminHeader, TenantSidebar/Header; shared UI in src/components/ui/*.
- Testing
  - Jest config: jest.config.js (next/jest, jsdom), setup: jest.setup.js, alias: ^@/(.*)$ -> src/.
  - Tests live under src/__tests__/.
- AI integration
  - src/ai/genkit.ts configures genkit with @genkit-ai/google-genai and model googleai/gemini-2.5-flash; dev entry at src/ai/dev.ts (used by genkit:dev/watch scripts).

Notes and gotchas
- next.config.js sets typescript.ignoreBuildErrors and eslint.ignoreDuringBuilds to true. CI should explicitly run pnpm typecheck and pnpm lint.
- Path alias '@/*' maps to ./src/* (see tsconfig.json). Jest is configured to respect this.
- Images allowlisted for next/image: placehold.co, images.unsplash.com, picsum.photos.
- Admin docs: see README_ADMIN.md for super admin panel flows, API endpoints, and troubleshooting. General setup: README.md.
